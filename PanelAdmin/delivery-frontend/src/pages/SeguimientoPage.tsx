import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ExternalLink,
  LocateFixed,
  MapPin,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  extractApiError,
  pedidosApi,
  repartidoresApi,
  ubicacionesApi,
} from '../api';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Badge,
  Button,
  Input,
  Modal,
  Select,
  Table,
  type TableColumn,
} from '../components/ui';
import type { UbicacionResponse } from '../types';

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function SeguimientoPage() {
  const queryClient = useQueryClient();

  const [selectedPedidoId, setSelectedPedidoId] = useState<string>('');
  const [selectedRepartidorId, setSelectedRepartidorId] = useState<string>('');
  const [focusedLocation, setFocusedLocation] =
    useState<UbicacionResponse | null>(null);

  // Modal: Registrar ubicación
  const [createOpen, setCreateOpen] = useState(false);
  const [formPedidoId, setFormPedidoId] = useState('');
  const [formRepartidorId, setFormRepartidorId] = useState('');
  const [latitud, setLatitud] = useState('-12.046374');
  const [longitud, setLongitud] = useState('-77.042793');
  const [geoLoading, setGeoLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFields, setCreateFields] = useState<Record<string, string>>({});

  const pedidosQuery = useQuery({
    queryKey: ['pedidos'],
    queryFn: () => pedidosApi.listar(),
  });

  const repartidoresQuery = useQuery({
    queryKey: ['repartidores'],
    queryFn: () => repartidoresApi.listar(),
  });

  const ubicacionesQuery = useQuery({
    queryKey: [
      'ubicaciones',
      selectedPedidoId || 'all',
      selectedRepartidorId || 'all',
    ],
    queryFn: () => {
      const pId = Number(selectedPedidoId);
      const rId = Number(selectedRepartidorId);
      if (pId && rId) {
        return ubicacionesApi.listarPorRepartidorYPedido(rId, pId);
      }
      if (pId) {
        return ubicacionesApi.listarPorPedido(pId);
      }
      return ubicacionesApi.listar();
    },
  });

  const crearMutation = useMutation({
    mutationFn: ubicacionesApi.crear,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['ubicaciones'] });
      setFocusedLocation(created);
      setCreateOpen(false);
      setCreateError(null);
      setCreateFields({});
    },
    onError: (err) => {
      const apiErr = extractApiError(err);
      setCreateError(apiErr.message);
      setCreateFields(apiErr.campos ?? {});
    },
  });

  const pedidos = pedidosQuery.data ?? [];
  const repartidores = repartidoresQuery.data ?? [];
  const ubicaciones = ubicacionesQuery.data ?? [];

  const activeLocation = focusedLocation ?? ubicaciones[0] ?? null;

  const openCreateModal = () => {
    const firstPedido = pedidos[0];
    setFormPedidoId(
      selectedPedidoId || (firstPedido ? String(firstPedido.id) : '')
    );
    setFormRepartidorId(
      selectedRepartidorId ||
        (firstPedido?.repartidorId
          ? String(firstPedido.repartidorId)
          : repartidores[0]
            ? String(repartidores[0].id)
            : '')
    );
    setCreateError(null);
    setCreateFields({});
    setCreateOpen(true);
  };

  const handleUseBrowserGeo = () => {
    if (!('geolocation' in navigator)) {
      setCreateError('Tu navegador no soporta geolocalización.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitud(pos.coords.latitude.toFixed(6));
        setLongitud(pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      () => {
        setCreateError(
          'No se pudo obtener la ubicación actual del navegador.'
        );
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleCreateSubmit = (event: FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    setCreateFields({});

    if (!formPedidoId || !formRepartidorId) {
      setCreateError('Debes seleccionar un pedido y un repartidor.');
      return;
    }

    crearMutation.mutate({
      pedidoId: Number(formPedidoId),
      repartidorId: Number(formRepartidorId),
      latitud: Number(latitud),
      longitud: Number(longitud),
    });
  };

  const columns: TableColumn<UbicacionResponse>[] = [
    {
      key: 'id',
      header: 'ID',
      numeric: true,
      render: (item) => (
        <span className="font-medium text-slate-900">#{item.id}</span>
      ),
    },
    {
      key: 'pedido',
      header: 'Pedido',
      numeric: true,
      render: (item) => <Badge tone="info">Pedido #{item.pedidoId}</Badge>,
    },
    {
      key: 'repartidor',
      header: 'Repartidor',
      render: (item) => (
        <span className="font-medium text-slate-900">
          {item.nombreRepartidor}
        </span>
      ),
    },
    {
      key: 'coordenadas',
      header: 'Latitud / Longitud',
      numeric: true,
      render: (item) => (
        <span className="font-mono text-xs text-slate-700">
          {Number(item.latitud).toFixed(6)}, {Number(item.longitud).toFixed(6)}
        </span>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha de registro',
      numeric: true,
      render: (item) => (
        <span className="text-xs text-slate-500">
          {formatDateTime(item.fechaRegistro)}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: 'Mapa',
      align: 'right',
      render: (item) => (
        <Button
          size="sm"
          variant={activeLocation?.id === item.id ? 'primary' : 'secondary'}
          onClick={() => setFocusedLocation(item)}
          leftIcon={<MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />}
        >
          Ver punto
        </Button>
      ),
    },
  ];

  const latNum = activeLocation ? Number(activeLocation.latitud) : -12.046374;
  const lngNum = activeLocation ? Number(activeLocation.longitud) : -77.042793;
  const delta = 0.008;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    lngNum - delta
  }%2C${latNum - delta}%2C${lngNum + delta}%2C${
    latNum + delta
  }&layer=mapnik&marker=${latNum}%2C${lngNum}`;
  const osmDirectUrl = `https://www.openstreetmap.org/?mlat=${latNum}&mlon=${lngNum}#map=16/${latNum}/${lngNum}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seguimiento y ubicaciones"
        description="Monitorea las coordenadas reportadas por los repartidores y consulta el trazado por pedido."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => void ubicacionesQuery.refetch()}
              loading={ubicacionesQuery.isFetching}
              leftIcon={<RefreshCw className="h-4 w-4" strokeWidth={1.75} />}
            >
              Actualizar
            </Button>
            <Button
              variant="primary"
              onClick={openCreateModal}
              leftIcon={<Plus className="h-4 w-4" strokeWidth={2} />}
            >
              Registrar ubicación
            </Button>
          </>
        }
      />

      {/* Filtros de consulta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Filtrar por pedido"
          value={selectedPedidoId}
          onChange={(e) => {
            setSelectedPedidoId(e.target.value);
            setFocusedLocation(null);
          }}
          options={[
            { value: '', label: 'Todos los pedidos' },
            ...pedidos.map((p) => ({
              value: p.id,
              label: `Pedido #${p.id} — ${p.nombreCliente} (${p.estado})`,
            })),
          ]}
        />

        <Select
          label="Filtrar por repartidor (requiere pedido seleccionado)"
          value={selectedRepartidorId}
          disabled={!selectedPedidoId}
          onChange={(e) => {
            setSelectedRepartidorId(e.target.value);
            setFocusedLocation(null);
          }}
          options={[
            { value: '', label: 'Todos los repartidores del pedido' },
            ...repartidores.map((r) => ({
              value: r.id,
              label: `${r.nombre} — DNI ${r.dni}`,
            })),
          ]}
        />
      </div>

      {/* Vista de mapa + listado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <Table
            data={ubicaciones}
            columns={columns}
            keyExtractor={(item) => item.id}
            loading={ubicacionesQuery.isLoading}
            emptyTitle="No hay coordenadas registradas"
            emptyDescription="Registra una ubicación para visualizar el recorrido del repartidor en el mapa."
            emptyAction={
              <Button size="sm" variant="primary" onClick={openCreateModal}>
                Registrar coordenada
              </Button>
            }
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Vista OpenStreetMap
              </h3>
              <p className="text-xs text-slate-500 tabular-nums">
                {activeLocation
                  ? `${activeLocation.nombreRepartidor} · Pedido #${activeLocation.pedidoId}`
                  : 'Sin punto seleccionado (Lima por defecto)'}
              </p>
            </div>
            <a
              href={osmDirectUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Abrir mapa
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
            </a>
          </div>

          <div className="aspect-[4/3] w-full bg-slate-100">
            <iframe
              title="Mapa de ubicación del repartidor"
              src={osmEmbedUrl}
              className="h-full w-full border-0"
              loading="lazy"
            />
          </div>

          {activeLocation && (
            <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-600 space-y-1 tabular-nums">
              <div className="flex justify-between">
                <span className="text-slate-500">Coordenadas:</span>
                <span className="font-mono font-medium text-slate-900">
                  {latNum.toFixed(6)}, {lngNum.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registrado:</span>
                <span>{formatDateTime(activeLocation.fechaRegistro)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Registrar nueva ubicación */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Registrar ubicación de entrega"
        description="Asocia una coordenada geográfica a un pedido y su repartidor asignado."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-crear-ubicacion"
              variant="primary"
              loading={crearMutation.isPending}
            >
              Guardar ubicación
            </Button>
          </>
        }
      >
        <form
          id="form-crear-ubicacion"
          onSubmit={handleCreateSubmit}
          className="space-y-4"
        >
          <Select
            label="Pedido"
            value={formPedidoId}
            onChange={(e) => {
              const val = e.target.value;
              setFormPedidoId(val);
              const found = pedidos.find((p) => String(p.id) === val);
              if (found?.repartidorId) {
                setFormRepartidorId(String(found.repartidorId));
              }
            }}
            options={pedidos.map((p) => ({
              value: p.id,
              label: `Pedido #${p.id} — ${p.nombreCliente} (${p.estado})`,
            }))}
            placeholder="Selecciona un pedido"
            error={createFields.pedidoId}
            required
          />

          <Select
            label="Repartidor"
            value={formRepartidorId}
            onChange={(e) => setFormRepartidorId(e.target.value)}
            options={repartidores.map((r) => ({
              value: r.id,
              label: `${r.nombre} — DNI ${r.dni} (${r.estado})`,
            }))}
            placeholder="Selecciona un repartidor"
            error={createFields.repartidorId}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Latitud (-90 a 90)"
              type="number"
              step="any"
              value={latitud}
              onChange={(e) => setLatitud(e.target.value)}
              error={createFields.latitud}
              required
            />
            <Input
              label="Longitud (-180 a 180)"
              type="number"
              step="any"
              value={longitud}
              onChange={(e) => setLongitud(e.target.value)}
              error={createFields.longitud}
              required
            />
          </div>

          <div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={geoLoading}
              onClick={handleUseBrowserGeo}
              leftIcon={<LocateFixed className="h-3.5 w-3.5" strokeWidth={1.75} />}
            >
              Usar mi ubicación actual (GPS navegador)
            </Button>
          </div>

          {createError && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
            >
              {createError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
