import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { pwaUbicacionesApi } from '../api';
import { useAuth } from './AuthContext';

export interface GeoLocationData {
  latitud: number;
  longitud: number;
  timestamp: string;
}

interface GeoContextValue {
  isTracking: boolean;
  hasActiveOrder: boolean;
  lastLocation: GeoLocationData | null;
  error: string | null;
  isSending: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  sendLocationNow: (pedidoId?: number) => Promise<GeoLocationData | null>;
  setHasActiveOrder: (active: boolean) => void;
}

const GeoContext = createContext<GeoContextValue | null>(null);

const INTERVAL_IDLE_MS = 180_000; // 3 minutos sin pedido en curso
const INTERVAL_ACTIVE_MS = 60_000; // 60 segundos con pedido activo
const MIN_DISTANCE_METERS = 30; // Filtro Haversine de 30m

function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const rad1 = (lat1 * Math.PI) / 180;
  const rad2 = (lat2 * Math.PI) / 180;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad1) * Math.cos(rad2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function GeoProvider({ children }: { children: ReactNode }) {
  const { driver, isAuthenticated, updateDriverState } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [lastLocation, setLastLocation] = useState<GeoLocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const lastCoordsRef = useRef<{ latitud: number; longitud: number } | null>(
    null
  );

  // Hidratar última ubicación reportada desde el backend
  useEffect(() => {
    if (
      driver &&
      driver.ultimaLatitud != null &&
      driver.ultimaLongitud != null &&
      !lastLocation
    ) {
      setLastLocation({
        latitud: driver.ultimaLatitud,
        longitud: driver.ultimaLongitud,
        timestamp: driver.ultimaUbicacionFecha ?? new Date().toISOString(),
      });
    }
  }, [driver, lastLocation]);

  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Tu navegador o dispositivo no soporta geolocalización.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 15000,
      });
    });
  }, []);

  const transmitCoordinates = useCallback(
    async (
      latitud: number,
      longitud: number,
      force = false,
      pedidoId?: number
    ): Promise<GeoLocationData | null> => {
      if (!force && lastCoordsRef.current) {
        const dist = getDistanceMeters(
          lastCoordsRef.current.latitud,
          lastCoordsRef.current.longitud,
          latitud,
          longitud
        );
        if (dist < MIN_DISTANCE_METERS) {
          return lastLocation;
        }
      }

      setIsSending(true);
      try {
        const updatedDriver = await pwaUbicacionesApi.registrar({
          latitud,
          longitud,
          pedidoId: pedidoId ?? null,
        });
        updateDriverState(updatedDriver);

        const nextLoc: GeoLocationData = {
          latitud,
          longitud,
          timestamp:
            updatedDriver.ultimaUbicacionFecha ?? new Date().toISOString(),
        };
        lastCoordsRef.current = { latitud, longitud };
        setLastLocation(nextLoc);
        setError(null);
        return nextLoc;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo sincronizar la ubicación GPS.'
        );
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [lastLocation, updateDriverState]
  );

  const sendLocationNow = useCallback(
    async (pedidoId?: number): Promise<GeoLocationData | null> => {
      try {
        setError(null);
        const pos = await getCurrentPosition();
        return await transmitCoordinates(
          pos.coords.latitude,
          pos.coords.longitude,
          true,
          pedidoId
        );
      } catch (err) {
        if (err && typeof err === 'object' && 'code' in err) {
          const geoErr = err as GeolocationPositionError;
          if (geoErr.code === geoErr.PERMISSION_DENIED) {
            setError(
              'Permiso de ubicación denegado. Activa el GPS en tu navegador.'
            );
          } else if (geoErr.code === geoErr.POSITION_UNAVAILABLE) {
            setError('Señal GPS no disponible temporalmente.');
          } else {
            setError('Tiempo de espera agotado al obtener coordenadas GPS.');
          }
        } else {
          setError('Error al obtener coordenadas GPS del dispositivo.');
        }
        return null;
      }
    },
    [getCurrentPosition, transmitCoordinates]
  );

  const startTracking = useCallback(async () => {
    setError(null);
    const sent = await sendLocationNow();
    if (sent) {
      setIsTracking(true);
    }
  }, [sendLocationNow]);

  const stopTracking = useCallback(async () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTracking(false);
    lastCoordsRef.current = null;
    try {
      const updated = await pwaUbicacionesApi.desactivar();
      updateDriverState(updated);
    } catch {
      // Ignorar fallo de red al apagar GPS
    }
  }, [updateDriverState]);

  // Ciclo automático cuando el repartidor está en servicio
  useEffect(() => {
    if (!isTracking || !isAuthenticated) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const intervalMs = hasActiveOrder ? INTERVAL_ACTIVE_MS : INTERVAL_IDLE_MS;
    intervalRef.current = window.setInterval(async () => {
      try {
        const pos = await getCurrentPosition();
        await transmitCoordinates(
          pos.coords.latitude,
          pos.coords.longitude,
          false
        );
      } catch {
        // Silencioso en polling periódico
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    isTracking,
    isAuthenticated,
    hasActiveOrder,
    getCurrentPosition,
    transmitCoordinates,
  ]);

  // Limpiar al cerrar sesión
  useEffect(() => {
    if (!isAuthenticated) {
      setIsTracking(false);
      setLastLocation(null);
      setError(null);
      lastCoordsRef.current = null;
    }
  }, [isAuthenticated]);

  const value = useMemo<GeoContextValue>(
    () => ({
      isTracking,
      hasActiveOrder,
      lastLocation,
      error,
      isSending,
      startTracking,
      stopTracking,
      sendLocationNow,
      setHasActiveOrder,
    }),
    [
      isTracking,
      hasActiveOrder,
      lastLocation,
      error,
      isSending,
      startTracking,
      stopTracking,
      sendLocationNow,
    ]
  );

  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>;
}

export function useGeo(): GeoContextValue {
  const context = useContext(GeoContext);
  if (!context) {
    throw new Error('useGeo debe utilizarse dentro de GeoProvider');
  }
  return context;
}
