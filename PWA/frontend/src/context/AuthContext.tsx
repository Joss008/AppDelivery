import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getStoredDriver,
  pwaAuthApi,
  pwaRepartidoresApi,
  saveStoredDriver,
  TOKEN_STORAGE_KEY,
} from '../api';
import type {
  EstadoRepartidor,
  RepartidorLoginRequest,
  RepartidorResponse,
} from '../types';

interface AuthContextValue {
  driver: RepartidorResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: RepartidorLoginRequest) => Promise<RepartidorResponse>;
  logout: () => Promise<void>;
  refreshDriver: () => Promise<RepartidorResponse | null>;
  updateDriverState: (nextDriver: RepartidorResponse) => void;
  changeDriverEstado: (estado: EstadoRepartidor) => Promise<RepartidorResponse>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [driver, setDriver] = useState<RepartidorResponse | null>(() =>
    getStoredDriver()
  );
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    Boolean(localStorage.getItem(TOKEN_STORAGE_KEY))
  );

  const updateDriverState = useCallback((nextDriver: RepartidorResponse) => {
    setDriver(nextDriver);
    saveStoredDriver(nextDriver);
  }, []);

  const refreshDriver = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setDriver(null);
      setIsLoading(false);
      return null;
    }
    try {
      const data = await pwaAuthApi.me();
      setDriver(data);
      return data;
    } catch {
      setDriver(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDriver();
  }, [refreshDriver]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setDriver(null);
      setIsLoading(false);
    };
    window.addEventListener('pwa:unauthorized', handleUnauthorized);
    return () =>
      window.removeEventListener('pwa:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (payload: RepartidorLoginRequest) => {
    const response = await pwaAuthApi.login(payload);
    setDriver(response.repartidor);
    return response.repartidor;
  }, []);

  const logout = useCallback(async () => {
    await pwaAuthApi.logout();
    setDriver(null);
  }, []);

  const changeDriverEstado = useCallback(
    async (estado: EstadoRepartidor) => {
      if (!driver) {
        throw new Error('Sesión de repartidor no activa');
      }
      const updated = await pwaRepartidoresApi.cambiarEstado(driver.id, estado);
      setDriver(updated);
      return updated;
    },
    [driver]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      driver,
      isAuthenticated: Boolean(driver && localStorage.getItem(TOKEN_STORAGE_KEY)),
      isLoading,
      login,
      logout,
      refreshDriver,
      updateDriverState,
      changeDriverEstado,
    }),
    [
      driver,
      isLoading,
      login,
      logout,
      refreshDriver,
      updateDriverState,
      changeDriverEstado,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  }
  return context;
}
