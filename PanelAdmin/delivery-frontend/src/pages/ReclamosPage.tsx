import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw } from 'lucide-react';
import { extractApiError, pedidosApi, reclamosApi } from '../api';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Badge,
  Button,
  Input,
  Modal,
  ReclamoEstadoBadge,
  Select,
  Table,
  Textarea,
  type TableColumn,
} from '../components/ui';
import type { EstadoReclamo, ReclamoResponse } from '../types';

const ESTADOS_RECLAMO: { value: EstadoReclamo; label: string }[] = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PROCESO', label: 'En proceso' },
  { value: 'RESUELTO', label: 'Resuelto' },
  { value: 'RECHAZADO', label: 'Rechazado' },
];

export function ReclamosPage() {
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [pedidoId, setPedidoId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingReclamo, setEditingReclamo] = useState<ReclamoResponse | null>(
    null
  );
  const [nuevoEstado, setNuevoEstado] = useState<EstadoReclamo>('EN_PROCESO');
  const [observacion, setObservacion] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const reclamosQuery = useQuery({
    queryKey: ['reclamos'],
    queryFn: async () => {
      try {
        return await reclamosApi.listar();
      } catch {
        return [] as ReclamoResponse[];
      }
    },
  });

  const pedidosQuery = useQuery({
    queryKey: ['pedidos'],
    queryFn: () => pedidosApi.listar(),
  });

  const crearMutation = useMutation({
    mutationFn: reclamosApi.crear,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reclamos'] });
      setCreateOpen(false);
      setMotivo('');
      setDescripcion('');
      setCreateError(null);
    },
    onError: (err) => {
      setCreateError(extractApiError(err).message);
    },
  });

  const cambiarEstadoMutation = useMutation({
    mutationFn: ({
      id,
      estado,
      obs,
    }: {
      id: number;
      estado: EstadoReclamo;
      obs?: string;
    }) =>
      reclamosApi.cambiarEstado(id, {
        estado,
        observacion: obs,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reclamos'] });
      setEditingReclamo(null);
      setEditError(null);
    },
    onError: (err) => {
      setEditError(extractApiError(err).message);
    },
  });

  const pedidos = pedidosQuery.data ?? [];
  const reclamos = reclamosQuery.data ?? [];

  const handleCreateSubmit = (event: FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    if (!pedidoId) {
      setCreateError('Selecciona un pedido.');
      return;
    }
    crearMutation.mutate({
      pedidoId: Number(pedidoId),
      motivo: motivo.trim(),
      descripcion: descripcion.trim(),
    });
  };

  const handleEstadoSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!editingReclamo) return;
    setEditError(null);
    cambiarEstadoMutation.mutate({
      id: editingReclamo.id,
      estado: nuevoEstado,
      obs: observacion.trim() || undefined,
    });
  };

  const columns: TableColumn<ReclamoResponse>[] = [
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
      key: 'motivo',
      header: 'Motivo / Descripción',
      render: (item) => (
        <div className="max-w-md">
          <p className="font-medium text-slate-900">{item.motivo}</p>
          <p className="text-xs text-slate-500 truncate">{item.descripcion}</p>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (item) => <ReclamoEstadoBadge estado={item.estado} />,
    },
    {
      key: 'observacion',
      header: 'Observación de atención',
      render: (item) => (
        <span className="text-xs text-slate-600">
          {item.observacion || '—'}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (item) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setEditingReclamo(item);
            setNuevoEstado(item.estado);
            setObservacion(item.observacion ?? '');
            setEditError(null);
          }}
        >
          Atender
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reclamos e incidencias"
        description="Registra incidencias asociadas a pedidos y gestiona el estado de su resolución."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => void reclamosQuery.refetch()}
              loading={reclamosQuery.isFetching}
              leftIcon={<RefreshCw className="h-4 w-4" strokeWidth={1.75} />}
            >
              Actualizar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setPedidoId(pedidos[0] ? String(pedidos[0].id) : '');
                setCreateError(null);
                setCreateOpen(true);
              }}
              leftIcon={<Plus className="h-4 w-4" strokeWidth={2} />}
            >
              Registrar reclamo
            </Button>
          </>
        }
      />

      <Table
        data={reclamos}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={reclamosQuery.isLoading}
        emptyTitle="No hay reclamos registrados"
        emptyDescription="Cuando se reporte una incidencia sobre un pedido aparecerá listada en esta tabla."
      />

      {/* Modal: Registrar reclamo */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Registrar reclamo o incidencia"
        description="Asocia el reclamo a un pedido existente."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-crear-reclamo"
              variant="primary"
              loading={crearMutation.isPending}
            >
              Guardar reclamo
            </Button>
          </>
        }
      >
        <form
          id="form-crear-reclamo"
          onSubmit={handleCreateSubmit}
          className="space-y-4"
        >
          <Select
            label="Pedido asociado"
            value={pedidoId}
            onChange={(e) => setPedidoId(e.target.value)}
            options={pedidos.map((p) => ({
              value: p.id,
              label: `Pedido #${p.id} — ${p.nombreCliente}`,
            }))}
            placeholder="Selecciona un pedido"
            required
          />

          <Input
            label="Motivo principal"
            placeholder="Ej. Demora en entrega, producto incompleto..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
          />

          <Textarea
            label="Descripción detallada"
            placeholder="Detalla lo ocurrido con el pedido..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
          />

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

      {/* Modal: Atender reclamo */}
      <Modal
        open={Boolean(editingReclamo)}
        onClose={() => setEditingReclamo(null)}
        size="sm"
        title={`Atender reclamo #${editingReclamo?.id ?? ''}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditingReclamo(null)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-atender-reclamo"
              variant="primary"
              loading={cambiarEstadoMutation.isPending}
            >
              Guardar estado
            </Button>
          </>
        }
      >
        <form
          id="form-atender-reclamo"
          onSubmit={handleEstadoSubmit}
          className="space-y-4"
        >
          <Select
            label="Estado de atención"
            value={nuevoEstado}
            onChange={(e) => setNuevoEstado(e.target.value as EstadoReclamo)}
            options={ESTADOS_RECLAMO}
            required
          />

          <Textarea
            label="Observación de resolución"
            placeholder="Acción tomada para resolver la incidencia..."
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
          />

          {editError && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
            >
              {editError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
