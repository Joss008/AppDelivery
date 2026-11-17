import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  MapPin,
  Navigation,
  Phone,
  Store,
  Truck,
  XCircle,
} from 'lucide-react';
import { extractApiError, pwaPedidosApi } from '../api';
import {
  Button,
  Input,
  Modal,
  PedidoEstadoBadge,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useGeo } from '../context/GeoContext';

function formatCurrency(amount: number): string {
  return `S/ ${Number(amount || 0).toFixed(2)}`;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function PedidoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const pedidoId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { driver, refreshDriver } = useAuth();
  const { sendLocationNow, lastLocation } = useGeo();

  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDeliveryOpen, setConfirmDeliveryOpen] = useState(false);
  const [observacionEntrega, setObservacionEntrega] = useState('');
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const pedidoQuery = useQuery({
    queryKey: ['pwa-pedido', pedidoId],
    queryFn: () => pwaPedidosApi.obtener(pedidoId),
    enabled: Number.isFinite(pedidoId) && pedidoId > 0,
    refetchInterval: 10000,
  });

  const historialQuery = useQuery({
    queryKey: ['pwa-pedido-historial', pedidoId],
    queryFn: () => pwaPedidosApi.historial(pedidoId),
    enabled: Number.isFinite(pedidoId) && pedidoId > 0,
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['pwa-pedido', pedidoId] }),
      queryClient.invalidateQueries({
        queryKey: ['pwa-pedido-historial', pedidoId],
      }),
      queryClient.invalidateQueries({ queryKey: ['pwa-pedidos'] }),
      refreshDriver(),
    ]);
  };

  const aceptarMutation = useMutation({
    mutationFn: () =>
      pwaPedidosApi.aceptar(pedidoId, {
        observacion: 'Aceptado por el repartidor desde la PWA',
      }),
    onSuccess: async () => {
      setActionError(null);
      void sendLocationNow(pedidoId);
      await invalidateAll();
    },
    onError: (err) => {
      setActionError(extractApiError(err).message);
    },
  });

  const iniciarRutaMutation = useMutation({
    mutationFn: async () => {
      const loc = await sendLocationNow(pedidoId);
      return pwaPedidosApi.cambiarEstado(pedidoId, {
        estado: 'EN_CAMINO',
        observacion: 'Repartidor en camino hacia la dirección de entrega',
        latitud: loc?.latitud,
        longitud: loc?.longitud,
      });
    },
    onSuccess: async () => {
      setActionError(null);
      await invalidateAll();
    },
    onError: (err) => {
      setActionError(extractApiError(err).message);
    },
  });

  const confirmarEntregaMutation = useMutation({
    mutationFn: async () => {
      const loc = await sendLocationNow(pedidoId);
      return pwaPedidosApi.cambiarEstado(pedidoId, {
        estado: 'ENTREGADO',
        observacion:
          observacionEntrega.trim() ||
          'Entrega confirmada en destino por el repartidor',
        latitud: loc?.latitud ?? lastLocation?.latitud,
        longitud: loc?.longitud ?? lastLocation?.longitud,
      });
    },
    onSuccess: async () => {
      setConfirmDeliveryOpen(false);
      setObservacionEntrega('');
      setActionError(null);
      await invalidateAll();
    },
    onError: (err) => {
      setActionError(extractApiError(err).message);
    },
  });

  const rechazarMutation = useMutation({
    mutationFn: () =>
      pwaPedidosApi.rechazar(pedidoId, {
        observacion:
          motivoRechazo.trim() || 'Liberado por el repartidor desde la PWA',
      }),
    onSuccess: async () => {
      setConfirmRejectOpen(false);
      setMotivoRechazo('');
      setActionError(null);
      await invalidateAll();
      navigate('/solicitudes');
    },
    onError: (err) => {
      setActionError(extractApiError(err).message);
    },
  });

  if (pedidoQuery.isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-10 w-32 rounded-xl bg-slate-200 animate-pulse" />
        <div className="h-48 rounded-2xl border border-slate-200 bg-white animate-pulse" />
        <div className="h-40 rounded-2xl border border-slate-200 bg-white animate-pulse" />
      </div>
    );
  }

  const pedido = pedidoQuery.data;

  if (!pedido) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-900">
          No se encontró el pedido solicitado
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/solicitudes')}
        >
          Volver a solicitudes
        </Button>
      </div>
    );
  }

  const esMio = pedido.repartidorId === driver?.id;
  const puedeAceptar =
    pedido.estado === 'PENDIENTE' &&
    (pedido.repartidorId === null || esMio);
  const puedeIniciarRuta =
    esMio &&
    (pedido.estado === 'ACEPTADO' ||
      pedido.estado === 'PREPARANDO' ||
      pedido.estado === 'LISTO');
  const puedeEntregar = esMio && pedido.estado === 'EN_CAMINO';
  const puedeLiberar =
    (pedido.estado === 'PENDIENTE' &&
      (pedido.repartidorId === null || esMio)) ||
    (esMio &&
      (pedido.estado === 'ACEPTADO' ||
        pedido.estado === 'PREPARANDO' ||
        pedido.estado === 'LISTO'));

  const mapsQuery = encodeURIComponent(pedido.direccionEntrega);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const historial = historialQuery.data ?? [];

  return (
    <div className="space-y-4">
      {/* Navegación superior */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Volver
        </button>

        <span className="text-xs text-slate-400 tabular-nums">
          Creado {formatDateTime(pedido.fechaCreacion)}
        </span>
      </div>

      {/* Cabecera del Pedido */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tabular-nums">
                Pedido #{pedido.id}
              </h2>
              <PedidoEstadoBadge estado={pedido.estado} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Comercio: <strong className="text-slate-700">{pedido.nombreComercialEmpresa}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Importe total</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {formatCurrency(pedido.importe)}
            </span>
          </div>
        </div>

        {pedido.descripcion && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-xs text-slate-700">
            <span className="font-semibold text-slate-900 block mb-0.5">
              Detalle del pedido:
            </span>
            {pedido.descripcion}
          </div>
        )}
      </section>

      {/* Datos de Ruta y Contacto */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Hoja de ruta y contacto
        </h3>

        {/* Punto de Recojo */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
              <Store className="h-4 w-4" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">
                1. Punto de recojo
              </p>
              <p className="text-xs font-semibold text-slate-900">
                {pedido.nombreComercialEmpresa}
              </p>
              <p className="text-xs text-slate-600">
                {pedido.direccionRecojo || 'Local principal de la empresa'}
              </p>
            </div>
          </div>

          {pedido.telefonoEmpresa && (
            <a
              href={`tel:${pedido.telefonoEmpresa}`}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 shrink-0 tabular-nums"
            >
              <Phone className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.8} />
              Llamar local
            </a>
          )}
        </div>

        {/* Punto de Entrega / Cliente */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500">
                  2. Destino de entrega · Cliente
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {pedido.nombreCliente}
                </p>
                <p className="text-xs font-medium text-slate-800 mt-0.5">
                  {pedido.direccionEntrega}
                </p>
                {pedido.referenciaDireccion && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Referencia: {pedido.referenciaDireccion}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Botones rápidos de llamada y mapa */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {pedido.telefonoCliente ? (
              <a
                href={`tel:${pedido.telefonoCliente}`}
                className="inline-flex items-center justify-center gap-1.5 h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] tabular-nums"
              >
                <Phone className="h-3.5 w-3.5 text-blue-600" strokeWidth={2} />
                {pedido.telefonoCliente}
              </a>
            ) : (
              <div className="inline-flex items-center justify-center h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-400">
                Sin teléfono
              </div>
            )}

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)]"
            >
              <ExternalLink
                className="h-3.5 w-3.5 text-blue-600"
                strokeWidth={2}
              />
              Abrir en Mapa
            </a>
          </div>
        </div>
      </section>

      {/* Panel de Acciones Operativas según Estado */}
      {(puedeAceptar || puedeIniciarRuta || puedeEntregar || puedeLiberar) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Acción operativa
          </h3>

          {actionError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
            >
              {actionError}
            </div>
          )}

          {puedeAceptar && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={aceptarMutation.isPending}
              leftIcon={<CheckCircle2 className="h-4.5 w-4.5" strokeWidth={2} />}
              onClick={() => aceptarMutation.mutate()}
            >
              Aceptar pedido ahora
            </Button>
          )}

          {puedeIniciarRuta && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={iniciarRutaMutation.isPending}
              leftIcon={<Truck className="h-4.5 w-4.5" strokeWidth={2} />}
              onClick={() => iniciarRutaMutation.mutate()}
            >
              Iniciar entrega (En camino)
            </Button>
          )}

          {puedeEntregar && (
            <Button
              variant="success"
              size="lg"
              fullWidth
              leftIcon={<CheckCircle2 className="h-4.5 w-4.5" strokeWidth={2} />}
              onClick={() => {
                setActionError(null);
                setConfirmDeliveryOpen(true);
              }}
            >
              Confirmar entrega al cliente
            </Button>
          )}

          {puedeLiberar && (
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              leftIcon={
                <XCircle className="h-4 w-4 text-rose-600" strokeWidth={1.8} />
              }
              onClick={() => {
                setActionError(null);
                setConfirmRejectOpen(true);
              }}
            >
              No puedo realizar esta entrega (Liberar pedido)
            </Button>
          )}
        </section>
      )}

      {/* Historial de Estados del Pedido */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-slate-500" strokeWidth={1.8} />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Trazabilidad del pedido
          </h3>
        </div>

        {historial.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aún no hay movimientos registrados.
          </p>
        ) : (
          <ol className="space-y-2.5">
            {historial.map((item) => (
              <li
                key={item.id}
                className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <PedidoEstadoBadge estado={item.estadoNuevo} />
                  <span className="text-[11px] text-slate-400 tabular-nums inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" strokeWidth={1.8} />
                    {formatDateTime(item.fecha)}
                  </span>
                </div>
                {item.observacion && (
                  <p className="mt-1.5 text-slate-600">{item.observacion}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Modal: Confirmar Entrega con Evidencia GPS */}
      <Modal
        open={confirmDeliveryOpen}
        onClose={() => setConfirmDeliveryOpen(false)}
        title="Confirmar entrega completada"
        description="Se registrará tu ubicación GPS actual como constancia de entrega en el sistema."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmDeliveryOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="success"
              size="sm"
              loading={confirmarEntregaMutation.isPending}
              onClick={() => confirmarEntregaMutation.mutate()}
            >
              Finalizar entrega
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3 flex items-start gap-2.5 text-xs text-emerald-900">
            <Navigation
              className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <div>
              <p className="font-semibold">Verificación GPS automática</p>
              <p className="text-emerald-700 mt-0.5">
                Al confirmar, enviaremos las coordenadas exactas al panel de{' '}
                {pedido.nombreComercialEmpresa}.
              </p>
            </div>
          </div>

          <Input
            label="Nota de entrega o código de conformidad (opcional)"
            placeholder="Ej. Entregado en recepción a Juan Pérez"
            value={observacionEntrega}
            onChange={(e) => setObservacionEntrega(e.target.value)}
          />
        </div>
      </Modal>

      {/* Modal: Rechazar / Liberar Pedido */}
      <Modal
        open={confirmRejectOpen}
        onClose={() => setConfirmRejectOpen(false)}
        title="Liberar pedido"
        description="El pedido volverá a estar disponible para que otro repartidor de la empresa pueda tomarlo."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmRejectOpen(false)}
            >
              Volver
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={rechazarMutation.isPending}
              onClick={() => rechazarMutation.mutate()}
            >
              Confirmar liberación
            </Button>
          </>
        }
      >
        <Input
          label="Motivo (opcional)"
          placeholder="Ej. Inconveniente mecánico o fuera de zona"
          value={motivoRechazo}
          onChange={(e) => setMotivoRechazo(e.target.value)}
        />
      </Modal>
    </div>
  );
}
