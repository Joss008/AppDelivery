import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CreditCard,
  IdCard,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { extractApiError, pwaPedidosApi } from '../api';
import {
  Button,
  Modal,
  RepartidorEstadoBadge,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useGeo } from '../context/GeoContext';
import type { EstadoRepartidor } from '../types';

const ESTADOS_DISPONIBILIDAD: {
  value: EstadoRepartidor;
  label: string;
  desc: string;
}[] = [
  {
    value: 'DISPONIBLE',
    label: 'Disponible',
    desc: 'Listo para recibir nuevos pedidos',
  },
  {
    value: 'OCUPADO',
    label: 'Ocupado',
    desc: 'Realizando una entrega activa',
  },
  {
    value: 'INACTIVO',
    label: 'Fuera de turno',
    desc: 'Pausa operativa temporal',
  },
];

function formatCurrency(amount: number): string {
  return `S/ ${Number(amount || 0).toFixed(2)}`;
}

export function PerfilPage() {
  const { driver, logout, changeDriverEstado } = useAuth();
  const { isTracking, lastLocation, stopTracking } = useGeo();

  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const pedidosQuery = useQuery({
    queryKey: ['pwa-pedidos'],
    queryFn: () => pwaPedidosApi.listar(),
  });

  const pedidos = pedidosQuery.data ?? [];
  const misEntregados = pedidos.filter(
    (p) => p.repartidorId === driver?.id && p.estado === 'ENTREGADO'
  );
  const totalRecaudado = misEntregados.reduce(
    (acc, p) => acc + Number(p.importe || 0),
    0
  );

  const handleEstadoChange = async (nuevoEstado: EstadoRepartidor) => {
    if (!driver || driver.estado === nuevoEstado) return;
    setStatusError(null);
    setStatusLoading(true);
    try {
      await changeDriverEstado(nuevoEstado);
    } catch (err) {
      setStatusError(extractApiError(err).message);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isTracking) {
      await stopTracking();
    }
    await logout();
  };

  if (!driver) return null;

  return (
    <div className="space-y-4">
      {/* Ficha principal del repartidor */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Ficha de repartidor #{driver.id}
            </p>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              {driver.nombre}
            </h2>
          </div>
          <RepartidorEstadoBadge estado={driver.estado} />
        </div>

        <div className="grid grid-cols-1 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between py-1">
            <span className="inline-flex items-center gap-2 text-slate-500">
              <Building2 className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
              Empresa afiliada
            </span>
            <span className="font-semibold text-slate-900">
              {driver.nombreComercialEmpresa}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="inline-flex items-center gap-2 text-slate-500">
              <IdCard className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
              Documento DNI
            </span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {driver.dni}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="inline-flex items-center gap-2 text-slate-500">
              <Phone className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
              Teléfono móvil
            </span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {driver.telefono || 'No registrado'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="inline-flex items-center gap-2 text-slate-500">
              <MapPin className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
              Última coordenada GPS
            </span>
            <span className="font-medium text-slate-800 tabular-nums">
              {lastLocation
                ? `${lastLocation.latitud.toFixed(4)}, ${lastLocation.longitud.toFixed(4)}`
                : 'Sin reporte reciente'}
            </span>
          </div>
        </div>
      </section>

      {/* Métricas operativas del repartidor */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <ShieldCheck
              className="h-4 w-4 text-emerald-600"
              strokeWidth={1.8}
            />
            Entregas completadas
          </div>
          <p className="mt-1.5 text-xl font-bold text-slate-900 tabular-nums">
            {misEntregados.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <CreditCard className="h-4 w-4 text-blue-600" strokeWidth={1.8} />
            Importe entregado
          </div>
          <p className="mt-1.5 text-xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(totalRecaudado)}
          </p>
        </div>
      </section>

      {/* Selector de Estado Operativo */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Disponibilidad en plataforma
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Este estado es visible en tiempo real desde el Panel Administrativo.
          </p>
        </div>

        {statusError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
          >
            {statusError}
          </div>
        )}

        <div className="space-y-2">
          {ESTADOS_DISPONIBILIDAD.map((opt) => {
            const active = driver.estado === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={statusLoading}
                onClick={() => void handleEstadoChange(opt.value)}
                className={[
                  'w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left cursor-pointer',
                  'transition-[border-color,background-color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.99]',
                  active
                    ? 'border-blue-600 bg-blue-50/60'
                    : 'border-slate-200 bg-white hover:bg-slate-50',
                ].join(' ')}
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-slate-500">{opt.desc}</p>
                </div>
                <span
                  className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                    active
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Estado de Telemetría */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Navigation
            className={`h-4.5 w-4.5 ${
              isTracking ? 'text-emerald-600' : 'text-slate-400'
            }`}
            strokeWidth={2}
          />
          <div>
            <p className="text-xs font-semibold text-slate-900">
               Estado del rastreo GPS
            </p>
            <p className="text-[11px] text-slate-500">
              {isTracking
                ? 'Transmitiendo ubicación al servidor central'
                : 'Transmisión en pausa'}
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-semibold ${
            isTracking ? 'text-emerald-600' : 'text-slate-500'
          }`}
        >
          {isTracking ? 'Activo' : 'Inactivo'}
        </span>
      </section>

      {/* Cerrar sesión */}
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        leftIcon={<LogOut className="h-4 w-4 text-rose-600" strokeWidth={2} />}
        onClick={() => setConfirmLogout(true)}
      >
        Cerrar sesión de repartidor
      </Button>

      <Modal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Cerrar turno y salir"
        description="Se detendrá la transmisión GPS y saldrás de tu cuenta en este dispositivo."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmLogout(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => void handleLogout()}
            >
              Cerrar sesión
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          Puedes volver a iniciar sesión en cualquier momento con tu teléfono o DNI.
        </p>
      </Modal>
    </div>
  );
}
