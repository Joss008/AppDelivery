import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  LocateFixed,
  MapPin,
  Navigation,
  Package,
  Power,
  RefreshCw,
  Store,
} from 'lucide-react';
import { extractApiError, pwaPedidosApi } from '../api';
import {
  Badge,
  Button,
  Modal,
  PedidoEstadoBadge,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useGeo } from '../context/GeoContext';
import type { PedidoResponse } from '../types';

function formatCurrency(amount: number): string {
  return `S/ ${Number(amount || 0).toFixed(2)}`;
}

function formatTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function InicioPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { driver, refreshDriver } = useAuth();
  const {
    isTracking,
    lastLocation,
    error: geoError,
    isSending,
    startTracking,
    stopTracking,
    sendLocationNow,
  } = useGeo();

  const [selectedOrder, setSelectedOrder] = useState<PedidoResponse | null>(
    null
  );
  const [confirmStopGps, setConfirmStopGps] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const pedidosQuery = useQuery({
    queryKey: ['pwa-pedidos'],
    queryFn: () => pwaPedidosApi.listar(),
    refetchInterval: 12000,
  });

  const aceptarMutation = useMutation({
    mutationFn: (pedidoId: number) =>
      pwaPedidosApi.aceptar(pedidoId, {
        observacion: 'Pedido aceptado desde la PWA de repartidor',
      }),
    onSuccess: async (updatedOrder) => {
      setSelectedOrder(null);
      setAcceptError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pwa-pedidos'] }),
        refreshDriver(),
      ]);
      navigate(`/solicitudes/${updatedOrder.id}`);
    },
    onError: (err) => {
      setAcceptError(extractApiError(err).message);
    },
  });

  const pedidos = pedidosQuery.data ?? [];

  // Pedidos activos asignados a este repartidor
  const misActivos = pedidos.filter(
    (p) =>
      p.repartidorId === driver?.id &&
      (p.estado === 'ACEPTADO' ||
        p.estado === 'PREPARANDO' ||
        p.estado === 'LISTO' ||
        p.estado === 'EN_CAMINO')
  );

  // Pedidos disponibles en bolsa de la empresa (PENDIENTE sin repartidor o asignados a mí en PENDIENTE)
  const disponibles = pedidos.filter(
    (p) =>
      p.estado === 'PENDIENTE' &&
      (p.repartidorId === null || p.repartidorId === driver?.id)
  );

  const entregadosHoy = pedidos.filter(
    (p) => p.repartidorId === driver?.id && p.estado === 'ENTREGADO'
  ).length;

  return (
    <div className="space-y-4">
      {/* Tarjeta de Control GPS y Servicio */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                isTracking
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <Navigation className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                  {isTracking ? 'En servicio (GPS activo)' : 'GPS desactivado'}
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {isTracking
                  ? 'Tu ubicación se sincroniza con el panel de la empresa.'
                  : 'Activa tu GPS para reportar ruta y facilitar asignaciones.'}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant={isTracking ? 'secondary' : 'success'}
            loading={isSending}
            onClick={() => {
              if (isTracking) {
                setConfirmStopGps(true);
              } else {
                void startTracking();
              }
            }}
            leftIcon={<Power className="h-3.5 w-3.5" strokeWidth={2} />}
          >
            {isTracking ? 'Pausar' : 'Activar'}
          </Button>
        </div>

        {lastLocation && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 tabular-nums">
              <LocateFixed
                className="h-3.5 w-3.5 text-blue-600 shrink-0"
                strokeWidth={1.8}
              />
              <span>
                {lastLocation.latitud.toFixed(5)},{' '}
                {lastLocation.longitud.toFixed(5)}
              </span>
              <span className="text-slate-400">
                · {formatTime(lastLocation.timestamp)}
              </span>
            </div>

            {isTracking && (
              <button
                type="button"
                disabled={isSending}
                onClick={() => void sendLocationNow(misActivos[0]?.id)}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isSending ? 'animate-spin' : ''}`}
                  strokeWidth={2}
                />
                Actualizar
              </button>
            )}
          </div>
        )}

        {geoError && (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
          >
            {geoError}
          </div>
        )}
      </section>

      {/* Resumen Rápido de Turno */}
      <section className="grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-medium text-slate-500">Disponibles</p>
          <p className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
            {disponibles.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-medium text-slate-500">En curso</p>
          <p className="mt-1 text-lg font-bold text-blue-600 tabular-nums">
            {misActivos.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-medium text-slate-500">Entregados</p>
          <p className="mt-1 text-lg font-bold text-emerald-600 tabular-nums">
            {entregadosHoy}
          </p>
        </div>
      </section>

      {/* Banner de Pedido Activo en Curso */}
      {misActivos.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Entrega en curso ({misActivos.length})
            </h2>
            <Link
              to="/solicitudes"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Ver todas
            </Link>
          </div>

          {misActivos.map((activo) => (
            <div
              key={activo.id}
              onClick={() => navigate(`/solicitudes/${activo.id}`)}
              className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs cursor-pointer transition-[transform,border-color,background-color] duration-150 ease-[var(--ease-out)] active:scale-[0.99] hover:border-blue-300"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 tabular-nums">
                    Pedido #{activo.id}
                  </span>
                  <PedidoEstadoBadge estado={activo.estado} />
                </div>
                <span className="text-sm font-bold text-slate-900 tabular-nums">
                  {formatCurrency(activo.importe)}
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-900">
                {activo.nombreCliente}
              </p>
              <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-600">
                <MapPin
                  className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <span className="line-clamp-2">{activo.direccionEntrega}</span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-blue-200/60 flex items-center justify-between text-xs font-semibold text-blue-700">
                <span>Continuar gestión de entrega</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Bolsa de Nuevos Pedidos Disponibles */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Pedidos disponibles
            </h2>
            <Badge tone={disponibles.length > 0 ? 'warning' : 'neutral'}>
              {disponibles.length}
            </Badge>
          </div>

          <button
            type="button"
            onClick={() => void pedidosQuery.refetch()}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                pedidosQuery.isFetching ? 'animate-spin text-blue-600' : ''
              }`}
              strokeWidth={1.8}
            />
            Actualizar
          </button>
        </div>

        {pedidosQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((skeleton) => (
              <div
                key={skeleton}
                className="h-36 rounded-2xl border border-slate-200 bg-white p-4 animate-pulse"
              />
            ))}
          </div>
        ) : disponibles.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <div className="mx-auto h-10 w-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2.5">
              <Package className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <p className="text-sm font-semibold text-slate-900">
              No hay pedidos pendientes ahora
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Cuando la empresa registre un nuevo pedido aparecerá aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {disponibles.map((pedido) => (
              <article
                key={pedido.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 tabular-nums">
                        #{pedido.id}
                      </span>
                      <PedidoEstadoBadge estado={pedido.estado} />
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 tabular-nums">
                        <Clock className="h-3 w-3" strokeWidth={1.8} />
                        {formatTime(pedido.fechaCreacion)}
                      </span>
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-slate-900">
                      {pedido.nombreCliente}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-bold text-slate-900 tabular-nums">
                      {formatCurrency(pedido.importe)}
                    </span>
                  </div>
                </div>

                {/* Ruta: Recojo -> Entrega */}
                <div className="space-y-2 rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs">
                  <div className="flex items-start gap-2">
                    <Store
                      className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5"
                      strokeWidth={1.8}
                    />
                    <div className="min-w-0">
                      <span className="font-medium text-slate-500">
                        Recojo ({pedido.nombreComercialEmpresa}):{' '}
                      </span>
                      <span className="text-slate-800">
                        {pedido.direccionRecojo || 'Local principal de la empresa'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin
                      className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5"
                      strokeWidth={1.8}
                    />
                    <div className="min-w-0">
                      <span className="font-medium text-slate-500">
                        Entrega:{' '}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {pedido.direccionEntrega}
                      </span>
                      {pedido.referenciaDireccion && (
                        <p className="text-slate-500 mt-0.5">
                          Ref: {pedido.referenciaDireccion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {pedido.descripcion && (
                  <p className="text-xs text-slate-600 line-clamp-2">
                    <span className="font-medium text-slate-700">Detalle:</span>{' '}
                    {pedido.descripcion}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/solicitudes/${pedido.id}`)}
                  >
                    Ver detalle
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    leftIcon={
                      <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                    }
                    onClick={() => {
                      setAcceptError(null);
                      setSelectedOrder(pedido);
                    }}
                  >
                    Aceptar pedido
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Modal: Confirmar aceptación de pedido */}
      <Modal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Aceptar pedido #${selectedOrder?.id ?? ''}`}
        description="El pedido quedará asignado a tu cuenta y pasará a estado Aceptado."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedOrder(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={aceptarMutation.isPending}
              onClick={() => {
                if (selectedOrder) {
                  aceptarMutation.mutate(selectedOrder.id);
                }
              }}
            >
              Confirmar asignación
            </Button>
          </>
        }
      >
        {selectedOrder && (
          <div className="space-y-3 text-xs text-slate-600">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-semibold text-slate-900">
                  {selectedOrder.nombreCliente}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Importe:</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatCurrency(selectedOrder.importe)}
                </span>
              </div>
              <div className="pt-1 border-t border-slate-200/70">
                <span className="text-slate-500 block">Dirección de entrega:</span>
                <span className="font-semibold text-slate-900">
                  {selectedOrder.direccionEntrega}
                </span>
              </div>
            </div>

            {acceptError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
              >
                {acceptError}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal: Confirmar desactivación de GPS */}
      <Modal
        open={confirmStopGps}
        onClose={() => setConfirmStopGps(false)}
        title="Pausar transmisión GPS"
        description="La empresa dejará de ver tu ubicación en tiempo real hasta que vuelvas a activarlo."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmStopGps(false)}
            >
              Seguir activo
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                void stopTracking();
                setConfirmStopGps(false);
              }}
            >
              Pausar GPS
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          Si tienes un pedido en camino, te recomendamos mantener el GPS activo para registrar la trazabilidad de la ruta.
        </p>
      </Modal>
    </div>
  );
}
