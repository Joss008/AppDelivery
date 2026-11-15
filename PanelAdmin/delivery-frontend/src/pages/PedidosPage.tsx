import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  History,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import {
  empresasApi,
  extractApiError,
  getStoredUser,
  pedidosApi,
  repartidoresApi,
} from '../api';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Badge,
  Button,
  Input,
  Modal,
  PedidoEstadoBadge,
  Select,
  Table,
  Textarea,
  type TableColumn,
} from '../components/ui';
import type { EstadoPedido, PedidoResponse } from '../types';

const TRANSICIONES_PERMITIDAS: Record<EstadoPedido, EstadoPedido[]> = {
  PENDIENTE: ['ACEPTADO', 'RECHAZADO', 'CANCELADO'],
  ACEPTADO: ['PREPARANDO', 'CANCELADO'],
  PREPARANDO: ['LISTO', 'CANCELADO'],
  LISTO: ['EN_CAMINO', 'CANCELADO'],
  EN_CAMINO: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
  RECHAZADO: [],
};

const ESTADO_LABELS: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  ACEPTADO: 'Aceptado',
  PREPARANDO: 'Preparando',
  LISTO: 'Listo para recoger',
  EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  RECHAZADO: 'Rechazado',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

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
  }).format(date);
}

export function PedidosPage() {
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const isAdmin = user?.rol === 'ADMIN';

  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');

  // Modal: Crear pedido
  const [createOpen, setCreateOpen] = useState(false);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [repartidorId, setRepartidorId] = useState<string>('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [referenciaDireccion, setReferenciaDireccion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [importe, setImporte] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFields, setCreateFields] = useState<Record<string, string>>({});

  // Modal: Editar pedido / Asignar repartidor
  const [editingPedido, setEditingPedido] = useState<PedidoResponse | null>(
    null
  );
  const [editRepartidorId, setEditRepartidorId] = useState<string>('');
  const [editNombreCliente, setEditNombreCliente] = useState('');
  const [editTelefonoCliente, setEditTelefonoCliente] = useState('');
  const [editDireccionEntrega, setEditDireccionEntrega] = useState('');
  const [editReferenciaDireccion, setEditReferenciaDireccion] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editImporte, setEditImporte] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  // Modal: Cambiar estado / Aceptar / Rechazar
  const [transitionPedido, setTransitionPedido] =
    useState<PedidoResponse | null>(null);
  const [targetEstado, setTargetEstado] = useState<EstadoPedido>('ACEPTADO');
  const [observacion, setObservacion] = useState('');
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // Modal: Historial del pedido
  const [historialPedido, setHistorialPedido] = useState<PedidoResponse | null>(
    null
  );

  const pedidosQuery = useQuery({
    queryKey: ['pedidos'],
    queryFn: () => pedidosApi.listar(),
  });

  const empresasQuery = useQuery({
    queryKey: ['empresas'],
    queryFn: () => empresasApi.listar(),
  });

  const repartidoresQuery = useQuery({
    queryKey: ['repartidores'],
    queryFn: () => repartidoresApi.listar(),
  });

  const historialQuery = useQuery({
    queryKey: ['pedidos', historialPedido?.id, 'historial'],
    queryFn: () => pedidosApi.listarHistorial(historialPedido!.id),
    enabled: Boolean(historialPedido),
  });

  const empresas = empresasQuery.data ?? [];
  const repartidores = repartidoresQuery.data ?? [];
  const pedidos = pedidosQuery.data ?? [];

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    void queryClient.invalidateQueries({ queryKey: ['repartidores'] });
  };

  const crearMutation = useMutation({
    mutationFn: pedidosApi.crear,
    onSuccess: () => {
      invalidateAll();
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

  const actualizarMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Parameters<typeof pedidosApi.actualizar>[1];
    }) => pedidosApi.actualizar(id, payload),
    onSuccess: () => {
      invalidateAll();
      setEditingPedido(null);
      setEditError(null);
      setEditFields({});
    },
    onError: (err) => {
      const apiErr = extractApiError(err);
      setEditError(apiErr.message);
      setEditFields(apiErr.campos ?? {});
    },
  });

  const transicionarMutation = useMutation({
    mutationFn: async ({
      pedido,
      destino,
      obs,
    }: {
      pedido: PedidoResponse;
      destino: EstadoPedido;
      obs?: string;
    }) => {
      if (pedido.estado === 'PENDIENTE' && destino === 'ACEPTADO') {
        return pedidosApi.aceptar(pedido.id, obs);
      }
      if (pedido.estado === 'PENDIENTE' && destino === 'RECHAZADO') {
        return pedidosApi.rechazar(pedido.id, obs);
      }
      return pedidosApi.cambiarEstado(pedido.id, {
        estado: destino,
        observacion: obs,
      });
    },
    onSuccess: () => {
      invalidateAll();
      setTransitionPedido(null);
      setObservacion('');
      setTransitionError(null);
    },
    onError: (err) => {
      const apiErr = extractApiError(err);
      setTransitionError(apiErr.message);
    },
  });

  const openCreateModal = () => {
    const defaultEmp = empresas[0]?.id ? String(empresas[0].id) : '';
    setEmpresaId(defaultEmp);
    setRepartidorId('');
    setNombreCliente('');
    setTelefonoCliente('');
    setDireccionEntrega('');
    setReferenciaDireccion('');
    setDescripcion('');
    setImporte('');
    setCreateError(null);
    setCreateFields({});
    setCreateOpen(true);
  };

  const openEditModal = (pedido: PedidoResponse) => {
    setEditingPedido(pedido);
    setEditRepartidorId(pedido.repartidorId ? String(pedido.repartidorId) : '');
    setEditNombreCliente(pedido.nombreCliente);
    setEditTelefonoCliente(pedido.telefonoCliente ?? '');
    setEditDireccionEntrega(pedido.direccionEntrega);
    setEditReferenciaDireccion(pedido.referenciaDireccion ?? '');
    setEditDescripcion(pedido.descripcion ?? '');
    setEditImporte(String(pedido.importe));
    setEditError(null);
    setEditFields({});
  };

  const openTransitionModal = (
    pedido: PedidoResponse,
    presetEstado?: EstadoPedido
  ) => {
    const allowed = TRANSICIONES_PERMITIDAS[pedido.estado] ?? [];
    if (allowed.length === 0) return;
    setTransitionPedido(pedido);
    setTargetEstado(
      presetEstado && allowed.includes(presetEstado) ? presetEstado : allowed[0]
    );
    setObservacion('');
    setTransitionError(null);
  };

  const handleCreateSubmit = (event: FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    setCreateFields({});

    const resolvedEmpresaId = Number(empresaId || empresas[0]?.id);
    if (!resolvedEmpresaId) {
      setCreateError('Selecciona una empresa válida.');
      return;
    }

    crearMutation.mutate({
      empresaId: resolvedEmpresaId,
      repartidorId: repartidorId ? Number(repartidorId) : null,
      nombreCliente: nombreCliente.trim(),
      telefonoCliente: telefonoCliente.trim() || undefined,
      direccionEntrega: direccionEntrega.trim(),
      referenciaDireccion: referenciaDireccion.trim() || undefined,
      descripcion: descripcion.trim() || undefined,
      importe: Number(importe),
    });
  };

  const handleEditSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!editingPedido) return;
    setEditError(null);
    setEditFields({});

    actualizarMutation.mutate({
      id: editingPedido.id,
      payload: {
        repartidorId: editRepartidorId ? Number(editRepartidorId) : null,
        nombreCliente: editNombreCliente.trim(),
        telefonoCliente: editTelefonoCliente.trim() || undefined,
        direccionEntrega: editDireccionEntrega.trim(),
        referenciaDireccion: editReferenciaDireccion.trim() || undefined,
        descripcion: editDescripcion.trim() || undefined,
        importe: Number(editImporte),
      },
    });
  };

  const handleTransitionSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!transitionPedido) return;
    setTransitionError(null);
    transicionarMutation.mutate({
      pedido: transitionPedido,
      destino: targetEstado,
      obs: observacion.trim() || undefined,
    });
  };

  const activeEmpresaIdForCreate = Number(empresaId || empresas[0]?.id || 0);
  const repartidoresParaCrear = repartidores.filter(
    (r) =>
      r.empresaId === activeEmpresaIdForCreate && r.estado !== 'INACTIVO'
  );

  const repartidoresParaEditar = editingPedido
    ? repartidores.filter(
        (r) =>
          r.empresaId === editingPedido.empresaId &&
          (r.estado !== 'INACTIVO' || r.id === editingPedido.repartidorId)
      )
    : [];

  const filteredPedidos = pedidos.filter((p) => {
    if (estadoFilter !== 'TODOS' && p.estado !== estadoFilter) {
      return false;
    }
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      String(p.id).includes(term) ||
      p.nombreCliente.toLowerCase().includes(term) ||
      p.direccionEntrega.toLowerCase().includes(term) ||
      (p.nombreRepartidor ?? '').toLowerCase().includes(term) ||
      (p.nombreComercialEmpresa ?? '').toLowerCase().includes(term)
    );
  });

  const columns: TableColumn<PedidoResponse>[] = [
    {
      key: 'id',
      header: 'ID',
      numeric: true,
      render: (item) => (
        <span className="font-medium text-slate-900">#{item.id}</span>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente / Entrega',
      render: (item) => (
        <div className="min-w-[180px] max-w-[260px]">
          <p className="font-medium text-slate-900 truncate">
            {item.nombreCliente}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {item.direccionEntrega}
          </p>
          {item.descripcion && (
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {item.descripcion}
            </p>
          )}
        </div>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: 'empresa',
            header: 'Empresa',
            render: (item: PedidoResponse) => (
              <span className="text-slate-700">
                {item.nombreComercialEmpresa}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'repartidor',
      header: 'Repartidor',
      render: (item) =>
        item.nombreRepartidor ? (
          <span className="text-slate-800">{item.nombreRepartidor}</span>
        ) : (
          <Badge tone="neutral">Sin asignar</Badge>
        ),
    },
    {
      key: 'importe',
      header: 'Importe',
      align: 'right',
      numeric: true,
      render: (item) => (
        <span className="font-medium text-slate-900">
          {formatCurrency(item.importe)}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (item) => <PedidoEstadoBadge estado={item.estado} />,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (item) => {
        const transiciones = TRANSICIONES_PERMITIDAS[item.estado] ?? [];
        const esFinal = transiciones.length === 0;

        return (
          <div className="inline-flex items-center justify-end gap-1.5">
            {item.estado === 'PENDIENTE' && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => openTransitionModal(item, 'ACEPTADO')}
                  leftIcon={<Check className="h-3.5 w-3.5" strokeWidth={2} />}
                >
                  Aceptar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openTransitionModal(item, 'RECHAZADO')}
                  leftIcon={
                    <X className="h-3.5 w-3.5 text-rose-600" strokeWidth={2} />
                  }
                >
                  Rechazar
                </Button>
              </>
            )}

            {item.estado !== 'PENDIENTE' && !esFinal && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => openTransitionModal(item)}
              >
                Avanzar estado
              </Button>
            )}

            {!esFinal && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openEditModal(item)}
                leftIcon={
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                }
              >
                Editar
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setHistorialPedido(item)}
              leftIcon={<History className="h-3.5 w-3.5" strokeWidth={1.75} />}
            >
              Historial
            </Button>
          </div>
        );
      },
    },
  ];

  const allowedTargetsForModal = transitionPedido
    ? TRANSICIONES_PERMITIDAS[transitionPedido.estado]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description="Registra pedidos, asigna repartidores disponibles y controla el flujo de estados hasta la entrega."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => void pedidosQuery.refetch()}
              loading={pedidosQuery.isFetching}
              leftIcon={
                <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
              }
            >
              Actualizar
            </Button>
            <Button
              variant="primary"
              onClick={openCreateModal}
              leftIcon={<Plus className="h-4 w-4" strokeWidth={2} />}
            >
              Nuevo pedido
            </Button>
          </>
        }
      />

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="sm:col-span-2">
          <Input
            label="Buscar pedido"
            placeholder="ID, cliente, dirección, repartidor o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftAdornment={<Search className="h-4 w-4" strokeWidth={1.75} />}
          />
        </div>
        <Select
          label="Filtrar por estado"
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          options={[
            { value: 'TODOS', label: 'Todos los estados' },
            ...Object.entries(ESTADO_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>

      <Table
        data={filteredPedidos}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={pedidosQuery.isLoading}
        emptyTitle="No se encontraron pedidos"
        emptyDescription="Crea un nuevo pedido para iniciar la operación de despacho."
        emptyAction={
          <Button size="sm" variant="primary" onClick={openCreateModal}>
            Crear pedido
          </Button>
        }
      />

      {/* Modal: Crear Pedido */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        size="lg"
        title="Registrar nuevo pedido"
        description="El pedido iniciará en estado PENDIENTE y quedará registrado en el historial."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-crear-pedido"
              variant="primary"
              loading={crearMutation.isPending}
            >
              Crear pedido
            </Button>
          </>
        }
      >
        <form
          id="form-crear-pedido"
          onSubmit={handleCreateSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isAdmin && (
              <Select
                label="Empresa"
                value={empresaId}
                onChange={(e) => {
                  setEmpresaId(e.target.value);
                  setRepartidorId('');
                }}
                options={empresas.map((emp) => ({
                  value: emp.id,
                  label: `${emp.nombreComercial} (#${emp.id})`,
                }))}
                placeholder="Selecciona una empresa"
                error={createFields.empresaId}
                required
              />
            )}

            <Select
              label="Repartidor asignado (opcional)"
              value={repartidorId}
              onChange={(e) => setRepartidorId(e.target.value)}
              options={[
                { value: '', label: 'Sin asignar todavía' },
                ...repartidoresParaCrear.map((rep) => ({
                  value: rep.id,
                  label: `${rep.nombre} (${rep.estado})`,
                })),
              ]}
              error={createFields.repartidorId}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre del cliente"
              placeholder="Ej. Lucía Fernández"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              error={createFields.nombreCliente}
              required
            />
            <Input
              label="Teléfono del cliente"
              placeholder="999 111 222"
              value={telefonoCliente}
              onChange={(e) => setTelefonoCliente(e.target.value)}
              error={createFields.telefonoCliente}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Dirección de entrega"
                placeholder="Av. Javier Prado Este 450, San Isidro"
                value={direccionEntrega}
                onChange={(e) => setDireccionEntrega(e.target.value)}
                error={createFields.direccionEntrega}
                required
              />
            </div>
            <Input
              label="Importe (S/)"
              type="number"
              step="0.01"
              min="0"
              placeholder="45.90"
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
              error={createFields.importe}
              required
            />
          </div>

          <Input
            label="Referencia de dirección"
            placeholder="Frente al parque, edificio gris piso 4"
            value={referenciaDireccion}
            onChange={(e) => setReferenciaDireccion(e.target.value)}
            error={createFields.referenciaDireccion}
          />

          <Textarea
            label="Descripción del pedido"
            placeholder="Detalle de productos, indicaciones de entrega..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            error={createFields.descripcion}
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

      {/* Modal: Editar Pedido / Asignar Repartidor */}
      <Modal
        open={Boolean(editingPedido)}
        onClose={() => setEditingPedido(null)}
        size="lg"
        title={`Editar pedido #${editingPedido?.id ?? ''}`}
        description="Actualiza los datos de entrega o asigna un repartidor activo de la misma empresa."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditingPedido(null)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-editar-pedido"
              variant="primary"
              loading={actualizarMutation.isPending}
            >
              Guardar cambios
            </Button>
          </>
        }
      >
        <form
          id="form-editar-pedido"
          onSubmit={handleEditSubmit}
          className="space-y-4"
        >
          <Select
            label="Repartidor asignado"
            value={editRepartidorId}
            onChange={(e) => setEditRepartidorId(e.target.value)}
            options={[
              { value: '', label: 'Sin asignar' },
              ...repartidoresParaEditar.map((rep) => ({
                value: rep.id,
                label: `${rep.nombre} — DNI ${rep.dni} (${rep.estado})`,
              })),
            ]}
            helperText="Requerido antes de pasar el pedido a estado EN_CAMINO."
            error={editFields.repartidorId}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre del cliente"
              value={editNombreCliente}
              onChange={(e) => setEditNombreCliente(e.target.value)}
              error={editFields.nombreCliente}
              required
            />
            <Input
              label="Teléfono del cliente"
              value={editTelefonoCliente}
              onChange={(e) => setEditTelefonoCliente(e.target.value)}
              error={editFields.telefonoCliente}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Dirección de entrega"
                value={editDireccionEntrega}
                onChange={(e) => setEditDireccionEntrega(e.target.value)}
                error={editFields.direccionEntrega}
                required
              />
            </div>
            <Input
              label="Importe (S/)"
              type="number"
              step="0.01"
              min="0"
              value={editImporte}
              onChange={(e) => setEditImporte(e.target.value)}
              error={editFields.importe}
              required
            />
          </div>

          <Input
            label="Referencia de dirección"
            value={editReferenciaDireccion}
            onChange={(e) => setEditReferenciaDireccion(e.target.value)}
            error={editFields.referenciaDireccion}
          />

          <Textarea
            label="Descripción del pedido"
            value={editDescripcion}
            onChange={(e) => setEditDescripcion(e.target.value)}
            error={editFields.descripcion}
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

      {/* Modal: Cambiar Estado / Aceptar / Rechazar */}
      <Modal
        open={Boolean(transitionPedido)}
        onClose={() => setTransitionPedido(null)}
        size="sm"
        title={`Cambiar estado — Pedido #${transitionPedido?.id ?? ''}`}
        description={`Estado actual: ${
          transitionPedido ? ESTADO_LABELS[transitionPedido.estado] : ''
        }`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setTransitionPedido(null)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-transicionar-pedido"
              variant={
                targetEstado === 'RECHAZADO' || targetEstado === 'CANCELADO'
                  ? 'danger'
                  : 'primary'
              }
              loading={transicionarMutation.isPending}
            >
              Confirmar cambio
            </Button>
          </>
        }
      >
        <form
          id="form-transicionar-pedido"
          onSubmit={handleTransitionSubmit}
          className="space-y-4"
        >
          <Select
            label="Nuevo estado"
            value={targetEstado}
            onChange={(e) => setTargetEstado(e.target.value as EstadoPedido)}
            options={allowedTargetsForModal.map((est) => ({
              value: est,
              label: ESTADO_LABELS[est],
            }))}
            required
          />

          {targetEstado === 'EN_CAMINO' &&
            transitionPedido &&
            !transitionPedido.repartidorId && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Atención: este pedido aún no tiene repartidor asignado. Asígnalo
                primero desde el botón <strong>Editar</strong> antes de pasarlo
                a <em>En camino</em>.
              </div>
            )}

          <Textarea
            label="Observación (opcional)"
            placeholder="Nota para el historial del pedido..."
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
          />

          {transitionError && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
            >
              {transitionError}
            </div>
          )}
        </form>
      </Modal>

      {/* Modal: Historial del Pedido */}
      <Modal
        open={Boolean(historialPedido)}
        onClose={() => setHistorialPedido(null)}
        size="lg"
        title={`Historial del pedido #${historialPedido?.id ?? ''}`}
        description={`Cliente: ${historialPedido?.nombreCliente ?? ''} · ${
          historialPedido?.direccionEntrega ?? ''
        }`}
        footer={
          <Button
            variant="secondary"
            onClick={() => setHistorialPedido(null)}
          >
            Cerrar
          </Button>
        }
      >
        {historialQuery.isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 w-full animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : (historialQuery.data ?? []).length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No hay eventos registrados para este pedido.
          </p>
        ) : (
          <ol className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
            {(historialQuery.data ?? []).map((evento) => (
              <li
                key={evento.id}
                className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {evento.estadoAnterior ? (
                      <>
                        <PedidoEstadoBadge estado={evento.estadoAnterior} />
                        <span className="text-xs text-slate-400">→</span>
                        <PedidoEstadoBadge estado={evento.estadoNuevo} />
                      </>
                    ) : (
                      <PedidoEstadoBadge estado={evento.estadoNuevo} />
                    )}
                  </div>
                  {evento.observacion && (
                    <p className="text-xs text-slate-700">
                      {evento.observacion}
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right text-xs text-slate-500 shrink-0 tabular-nums">
                  <p className="font-medium text-slate-700">
                    {evento.nombreUsuario || `Usuario #${evento.usuarioId}`}
                  </p>
                  <p>{formatDateTime(evento.fecha)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Modal>
    </div>
  );
}
