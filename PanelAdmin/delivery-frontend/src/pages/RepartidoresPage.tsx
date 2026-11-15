import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  empresasApi,
  extractApiError,
  getStoredUser,
  repartidoresApi,
} from '../api';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Button,
  Input,
  Modal,
  RepartidorEstadoBadge,
  Select,
  Table,
  type TableColumn,
} from '../components/ui';
import type {
  ActualizarRepartidorRequest,
  EstadoRepartidor,
  RepartidorResponse,
} from '../types';

const ESTADO_OPTIONS: { value: EstadoRepartidor; label: string }[] = [
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'OCUPADO', label: 'Ocupado' },
  { value: 'INACTIVO', label: 'Inactivo' },
];

export function RepartidoresPage() {
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const isAdmin = user?.rol === 'ADMIN';

  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');

  // Crear repartidor
  const [createOpen, setCreateOpen] = useState(false);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFields, setCreateFields] = useState<Record<string, string>>({});

  // Editar repartidor
  const [editingItem, setEditingItem] = useState<RepartidorResponse | null>(
    null
  );
  const [editForm, setEditForm] = useState<ActualizarRepartidorRequest>({
    nombre: '',
    dni: '',
    telefono: '',
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  // Eliminar repartidor
  const [deletingItem, setDeletingItem] = useState<RepartidorResponse | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const repartidoresQuery = useQuery({
    queryKey: ['repartidores'],
    queryFn: () => repartidoresApi.listar(),
  });

  const empresasQuery = useQuery({
    queryKey: ['empresas'],
    queryFn: () => empresasApi.listar(),
  });

  const empresas = empresasQuery.data ?? [];

  const crearMutation = useMutation({
    mutationFn: repartidoresApi.crear,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['repartidores'] });
      setCreateOpen(false);
      setNombre('');
      setDni('');
      setTelefono('');
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
      payload: ActualizarRepartidorRequest;
    }) => repartidoresApi.actualizar(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['repartidores'] });
      setEditingItem(null);
      setEditError(null);
      setEditFields({});
    },
    onError: (err) => {
      const apiErr = extractApiError(err);
      setEditError(apiErr.message);
      setEditFields(apiErr.campos ?? {});
    },
  });

  const cambiarEstadoMutation = useMutation({
    mutationFn: ({
      id,
      estado,
    }: {
      id: number;
      estado: EstadoRepartidor;
    }) => repartidoresApi.cambiarEstado(id, estado),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['repartidores'] });
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => repartidoresApi.eliminar(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['repartidores'] });
      setDeletingItem(null);
      setDeleteError(null);
    },
    onError: (err) => {
      const apiErr = extractApiError(err);
      setDeleteError(apiErr.message);
    },
  });

  const openCreateModal = () => {
    const defaultEmpresaId = empresas[0]?.id ? String(empresas[0].id) : '';
    setEmpresaId(defaultEmpresaId);
    setNombre('');
    setDni('');
    setTelefono('');
    setCreateError(null);
    setCreateFields({});
    setCreateOpen(true);
  };

  const openEditModal = (item: RepartidorResponse) => {
    setEditingItem(item);
    setEditForm({
      nombre: item.nombre,
      dni: item.dni,
      telefono: item.telefono ?? '',
    });
    setEditError(null);
    setEditFields({});
  };

  const handleCreateSubmit = (event: FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    setCreateFields({});

    const resolvedEmpresaId = Number(empresaId || empresas[0]?.id);
    if (!resolvedEmpresaId) {
      setCreateError('Debes seleccionar una empresa válida.');
      return;
    }

    crearMutation.mutate({
      empresaId: resolvedEmpresaId,
      nombre: nombre.trim(),
      dni: dni.trim(),
      telefono: telefono.trim() || undefined,
    });
  };

  const handleEditSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!editingItem) return;
    setEditError(null);
    setEditFields({});

    actualizarMutation.mutate({
      id: editingItem.id,
      payload: {
        nombre: editForm.nombre.trim(),
        dni: editForm.dni.trim(),
        telefono: editForm.telefono?.trim() || undefined,
      },
    });
  };

  const repartidores = repartidoresQuery.data ?? [];
  const filtered = repartidores.filter((r) => {
    if (estadoFilter !== 'TODOS' && r.estado !== estadoFilter) {
      return false;
    }
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      r.nombre.toLowerCase().includes(term) ||
      r.dni.toLowerCase().includes(term) ||
      (r.telefono ?? '').toLowerCase().includes(term) ||
      r.nombreComercialEmpresa.toLowerCase().includes(term)
    );
  });

  const columns: TableColumn<RepartidorResponse>[] = [
    {
      key: 'id',
      header: 'ID',
      numeric: true,
      render: (item) => (
        <span className="font-medium text-slate-900">#{item.id}</span>
      ),
    },
    {
      key: 'nombre',
      header: 'Repartidor',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">{item.nombre}</p>
          <p className="text-xs text-slate-500 tabular-nums">
            DNI: {item.dni}
          </p>
        </div>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: 'empresa',
            header: 'Empresa',
            render: (item: RepartidorResponse) => (
              <span className="text-slate-700">
                {item.nombreComercialEmpresa}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'telefono',
      header: 'Teléfono',
      numeric: true,
      render: (item) => (
        <span className="text-slate-700">{item.telefono || '—'}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado actual',
      render: (item) => <RepartidorEstadoBadge estado={item.estado} />,
    },
    {
      key: 'cambiarEstado',
      header: 'Cambiar estado',
      render: (item) => (
        <select
          aria-label={`Cambiar estado de ${item.nombre}`}
          value={item.estado}
          disabled={cambiarEstadoMutation.isPending}
          onChange={(e) =>
            cambiarEstadoMutation.mutate({
              id: item.id,
              estado: e.target.value as EstadoRepartidor,
            })
          }
          className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
        >
          {ESTADO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (item) => (
        <div className="inline-flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openEditModal(item)}
            leftIcon={<Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setDeleteError(null);
              setDeletingItem(item);
            }}
            leftIcon={
              <Trash2 className="h-3.5 w-3.5 text-rose-600" strokeWidth={1.75} />
            }
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repartidores"
        description="Administra el padrón de repartidores, su disponibilidad operativa y datos de contacto."
        actions={
          <Button
            variant="primary"
            onClick={openCreateModal}
            leftIcon={<Plus className="h-4 w-4" strokeWidth={2} />}
          >
            Nuevo repartidor
          </Button>
        }
      />

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="sm:col-span-2">
          <Input
            label="Buscar repartidor"
            placeholder="Nombre, DNI, teléfono o empresa..."
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
            ...ESTADO_OPTIONS,
          ]}
        />
      </div>

      <Table
        data={filtered}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={repartidoresQuery.isLoading}
        emptyTitle="No hay repartidores para mostrar"
        emptyDescription="Registra un repartidor para poder asignarlo a los pedidos."
        emptyAction={
          <Button size="sm" variant="primary" onClick={openCreateModal}>
            Registrar repartidor
          </Button>
        }
      />

      {/* Modal: Crear repartidor */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Registrar repartidor"
        description="El repartidor se creará con estado inicial DISPONIBLE."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-crear-repartidor"
              variant="primary"
              loading={crearMutation.isPending}
            >
              Registrar
            </Button>
          </>
        }
      >
        <form
          id="form-crear-repartidor"
          onSubmit={handleCreateSubmit}
          className="space-y-4"
        >
          {isAdmin && (
            <Select
              label="Empresa asignada"
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              options={empresas.map((emp) => ({
                value: emp.id,
                label: `${emp.nombreComercial} (#${emp.id})`,
              }))}
              placeholder="Selecciona una empresa"
              error={createFields.empresaId}
              required
            />
          )}

          <Input
            label="Nombre completo"
            placeholder="Carlos Mendoza"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            error={createFields.nombre}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Documento (DNI)"
              placeholder="72345678"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              error={createFields.dni}
              required
            />
            <Input
              label="Teléfono"
              placeholder="987 654 321"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              error={createFields.telefono}
            />
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

      {/* Modal: Editar repartidor */}
      <Modal
        open={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title="Editar repartidor"
        description={`Actualizando datos de ${editingItem?.nombre ?? ''}.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-editar-repartidor"
              variant="primary"
              loading={actualizarMutation.isPending}
            >
              Guardar cambios
            </Button>
          </>
        }
      >
        <form
          id="form-editar-repartidor"
          onSubmit={handleEditSubmit}
          className="space-y-4"
        >
          <Input
            label="Nombre completo"
            value={editForm.nombre}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, nombre: e.target.value }))
            }
            error={editFields.nombre}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Documento (DNI)"
              value={editForm.dni}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, dni: e.target.value }))
              }
              error={editFields.dni}
              required
            />
            <Input
              label="Teléfono"
              value={editForm.telefono ?? ''}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, telefono: e.target.value }))
              }
              error={editFields.telefono}
            />
          </div>

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

      {/* Modal: Confirmar eliminación */}
      <Modal
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        size="sm"
        title="Eliminar repartidor"
        description="Esta acción no se puede deshacer."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingItem(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={eliminarMutation.isPending}
              onClick={() => {
                if (deletingItem) {
                  eliminarMutation.mutate(deletingItem.id);
                }
              }}
            >
              Confirmar eliminación
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            ¿Estás seguro de que deseas eliminar al repartidor{' '}
            <strong className="font-semibold text-slate-900">
              {deletingItem?.nombre}
            </strong>{' '}
            (DNI {deletingItem?.dni})?
          </p>
          {deleteError && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
            >
              {deleteError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
