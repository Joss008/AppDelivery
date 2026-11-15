import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Power, Search } from 'lucide-react';
import { empresasApi, extractApiError, getStoredUser } from '../api';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Badge,
  Button,
  Input,
  Modal,
  Table,
  type TableColumn,
} from '../components/ui';
import type {
  ActualizarEmpresaRequest,
  EmpresaResponse,
  RegistroEmpresaRequest,
} from '../types';

export function EmpresasPage() {
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const isAdmin = user?.rol === 'ADMIN';

  const [search, setSearch] = useState('');

  // Modal de registro (solo ADMIN)
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<RegistroEmpresaRequest>({
    nombre: '',
    email: '',
    password: '',
    nombreComercial: '',
    direccion: '',
    telefono: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFields, setCreateFields] = useState<Record<string, string>>({});

  // Modal de edición (ADMIN o EMPRESA)
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaResponse | null>(
    null
  );
  const [editForm, setEditForm] = useState<ActualizarEmpresaRequest>({
    nombreComercial: '',
    direccion: '',
    telefono: '',
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  const empresasQuery = useQuery({
    queryKey: ['empresas'],
    queryFn: () => empresasApi.listar(),
  });

  const registrarMutation = useMutation({
    mutationFn: (payload: RegistroEmpresaRequest) =>
      empresasApi.registrar(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['empresas'] });
      setCreateOpen(false);
      setCreateForm({
        nombre: '',
        email: '',
        password: '',
        nombreComercial: '',
        direccion: '',
        telefono: '',
      });
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
      payload: ActualizarEmpresaRequest;
    }) => empresasApi.actualizar(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['empresas'] });
      setEditingEmpresa(null);
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
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      empresasApi.cambiarEstado(id, activo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });

  const openEditModal = (empresa: EmpresaResponse) => {
    setEditingEmpresa(empresa);
    setEditForm({
      nombreComercial: empresa.nombreComercial,
      direccion: empresa.direccion ?? '',
      telefono: empresa.telefono ?? '',
    });
    setEditError(null);
    setEditFields({});
  };

  const handleCreateSubmit = (event: FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    setCreateFields({});
    registrarMutation.mutate({
      nombre: createForm.nombre.trim(),
      email: createForm.email.trim(),
      password: createForm.password,
      nombreComercial: createForm.nombreComercial.trim(),
      direccion: createForm.direccion?.trim() || undefined,
      telefono: createForm.telefono?.trim() || undefined,
    });
  };

  const handleEditSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!editingEmpresa) return;
    setEditError(null);
    setEditFields({});
    actualizarMutation.mutate({
      id: editingEmpresa.id,
      payload: {
        nombreComercial: editForm.nombreComercial.trim(),
        direccion: editForm.direccion?.trim() || undefined,
        telefono: editForm.telefono?.trim() || undefined,
      },
    });
  };

  const empresas = empresasQuery.data ?? [];
  const filteredEmpresas = empresas.filter((e) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      e.nombreComercial.toLowerCase().includes(term) ||
      (e.nombre ?? '').toLowerCase().includes(term) ||
      (e.email ?? '').toLowerCase().includes(term) ||
      (e.telefono ?? '').toLowerCase().includes(term)
    );
  });

  const columns: TableColumn<EmpresaResponse>[] = [
    {
      key: 'id',
      header: 'ID',
      numeric: true,
      render: (item) => (
        <span className="font-medium text-slate-900">#{item.id}</span>
      ),
    },
    {
      key: 'nombreComercial',
      header: 'Nombre comercial',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">{item.nombreComercial}</p>
          <p className="text-xs text-slate-500">
            {item.direccion || 'Sin dirección registrada'}
          </p>
        </div>
      ),
    },
    {
      key: 'responsable',
      header: 'Responsable / Correo',
      render: (item) => (
        <div>
          <p className="text-slate-800">{item.nombre}</p>
          <p className="text-xs text-slate-500">{item.email}</p>
        </div>
      ),
    },
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
      header: 'Estado',
      render: (item) => (
        <Badge tone={item.activo ? 'success' : 'danger'} dot>
          {item.activo ? 'Activa' : 'Inactiva'}
        </Badge>
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
          {isAdmin && (
            <Button
              size="sm"
              variant={item.activo ? 'ghost' : 'secondary'}
              loading={
                cambiarEstadoMutation.isPending &&
                cambiarEstadoMutation.variables?.id === item.id
              }
              onClick={() =>
                cambiarEstadoMutation.mutate({
                  id: item.id,
                  activo: !item.activo,
                })
              }
              leftIcon={<Power className="h-3.5 w-3.5" strokeWidth={1.75} />}
            >
              {item.activo ? 'Desactivar' : 'Activar'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? 'Empresas registradas' : 'Mi empresa'}
        description={
          isAdmin
            ? 'Administra las empresas afiliadas, actualiza sus datos comerciales y controla su estado.'
            : 'Consulta y actualiza la información comercial de tu empresa.'
        }
        actions={
          isAdmin ? (
            <Button
              variant="primary"
              onClick={() => {
                setCreateError(null);
                setCreateFields({});
                setCreateOpen(true);
              }}
              leftIcon={<Plus className="h-4 w-4" strokeWidth={2} />}
            >
              Registrar empresa
            </Button>
          ) : undefined
        }
      />

      {isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:max-w-xs">
            <Input
              label="Buscar empresa"
              placeholder="Nombre comercial, correo o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftAdornment={
                <Search className="h-4 w-4" strokeWidth={1.75} />
              }
            />
          </div>
          <p className="text-xs text-slate-500 tabular-nums self-end">
            Mostrando {filteredEmpresas.length} de {empresas.length} empresas
          </p>
        </div>
      )}

      <Table
        data={filteredEmpresas}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={empresasQuery.isLoading}
        emptyTitle="No se encontraron empresas"
        emptyDescription={
          search
            ? 'Intenta con otro término de búsqueda.'
            : 'Aún no hay empresas registradas en la plataforma.'
        }
      />

      {/* Modal: Registrar nueva empresa (ADMIN) */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Registrar nueva empresa"
        description="Se creará la empresa junto con su usuario de acceso con rol EMPRESA."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-crear-empresa"
              variant="primary"
              loading={registrarMutation.isPending}
            >
              Guardar empresa
            </Button>
          </>
        }
      >
        <form
          id="form-crear-empresa"
          onSubmit={handleCreateSubmit}
          className="space-y-4"
        >
          <Input
            label="Nombre del responsable"
            placeholder="Ej. María Gómez"
            value={createForm.nombre}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, nombre: e.target.value }))
            }
            error={createFields.nombre}
            required
          />

          <Input
            label="Nombre comercial"
            placeholder="Ej. Pizzería Donatello"
            value={createForm.nombreComercial}
            onChange={(e) =>
              setCreateForm((prev) => ({
                ...prev,
                nombreComercial: e.target.value,
              }))
            }
            error={createFields.nombreComercial}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="empresa@correo.com"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, email: e.target.value }))
              }
              error={createFields.email}
              required
            />
            <Input
              label="Contraseña inicial"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={createForm.password}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, password: e.target.value }))
              }
              error={createFields.password}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              placeholder="999 888 777"
              value={createForm.telefono ?? ''}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, telefono: e.target.value }))
              }
              error={createFields.telefono}
            />
            <Input
              label="Dirección comercial"
              placeholder="Av. Arequipa 1240"
              value={createForm.direccion ?? ''}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  direccion: e.target.value,
                }))
              }
              error={createFields.direccion}
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

      {/* Modal: Actualizar empresa */}
      <Modal
        open={Boolean(editingEmpresa)}
        onClose={() => setEditingEmpresa(null)}
        title="Actualizar datos de empresa"
        description={`Modificando información comercial de ${editingEmpresa?.nombreComercial ?? ''}.`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditingEmpresa(null)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-editar-empresa"
              variant="primary"
              loading={actualizarMutation.isPending}
            >
              Guardar cambios
            </Button>
          </>
        }
      >
        <form
          id="form-editar-empresa"
          onSubmit={handleEditSubmit}
          className="space-y-4"
        >
          <Input
            label="Nombre comercial"
            value={editForm.nombreComercial}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                nombreComercial: e.target.value,
              }))
            }
            error={editFields.nombreComercial}
            required
          />

          <Input
            label="Teléfono"
            placeholder="999 888 777"
            value={editForm.telefono ?? ''}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, telefono: e.target.value }))
            }
            error={editFields.telefono}
          />

          <Input
            label="Dirección comercial"
            placeholder="Av. Principal 123"
            value={editForm.direccion ?? ''}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, direccion: e.target.value }))
            }
            error={editFields.direccion}
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
