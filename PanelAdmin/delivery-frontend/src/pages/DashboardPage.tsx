import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Plus,
  RefreshCw,
  Truck,
  UserCheck,
} from 'lucide-react';
import {
  authApi,
  empresasApi,
  getStoredUser,
  pedidosApi,
  repartidoresApi,
} from '../api';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Badge,
  Button,
  PedidoEstadoBadge,
  RepartidorEstadoBadge,
  Table,
  type TableColumn,
} from '../components/ui';
import type { PedidoResponse, RepartidorResponse } from '../types';

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
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function DashboardPage() {
  const storedUser = getStoredUser();
  const isAdmin = storedUser?.rol === 'ADMIN';

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
  });

  const pedidosQuery = useQuery({
    queryKey: ['pedidos'],
    queryFn: () => pedidosApi.listar(),
  });

  const repartidoresQuery = useQuery({
    queryKey: ['repartidores'],
    queryFn: () => repartidoresApi.listar(),
  });

  const empresasQuery = useQuery({
    queryKey: ['empresas'],
    queryFn: () => empresasApi.listar(),
  });

  const pedidos = pedidosQuery.data ?? [];
  const repartidores = repartidoresQuery.data ?? [];
  const empresas = empresasQuery.data ?? [];

  const pedidosActivos = pedidos.filter((p) =>
    ['PENDIENTE', 'ACEPTADO', 'PREPARANDO', 'LISTO', 'EN_CAMINO'].includes(
      p.estado
    )
  );
  const pedidosEntregados = pedidos.filter((p) => p.estado === 'ENTREGADO');
  const repartidoresDisponibles = repartidores.filter(
    (r) => r.estado === 'DISPONIBLE'
  );
  const empresasActivas = empresas.filter((e) => e.activo);

  const importeTotalEntregado = pedidosEntregados.reduce(
    (acc, item) => acc + (Number(item.importe) || 0),
    0
  );

  const recentPedidos = [...pedidos]
    .sort(
      (a, b) =>
        new Date(b.fechaCreacion).getTime() -
        new Date(a.fechaCreacion).getTime()
    )
    .slice(0, 6);

  const handleRefreshAll = () => {
    void pedidosQuery.refetch();
    void repartidoresQuery.refetch();
    void empresasQuery.refetch();
    void meQuery.refetch();
  };

  const isRefreshing =
    pedidosQuery.isFetching ||
    repartidoresQuery.isFetching ||
    empresasQuery.isFetching;

  const pedidoColumns: TableColumn<PedidoResponse>[] = [
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
      header: 'Cliente / Destino',
      render: (item) => (
        <div className="min-w-[160px]">
          <p className="font-medium text-slate-900 truncate">
            {item.nombreCliente}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {item.direccionEntrega}
          </p>
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
          <span className="text-slate-700">{item.nombreRepartidor}</span>
        ) : (
          <span className="text-xs text-slate-400">Sin asignar</span>
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
      key: 'fecha',
      header: 'Creado',
      numeric: true,
      render: (item) => (
        <span className="text-xs text-slate-500">
          {formatDateTime(item.fechaCreacion)}
        </span>
      ),
    },
  ];

  const repartidorColumns: TableColumn<RepartidorResponse>[] = [
    {
      key: 'nombre',
      header: 'Repartidor',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">{item.nombre}</p>
          <p className="text-xs text-slate-500 tabular-nums">
            DNI {item.dni} {item.telefono ? `· ${item.telefono}` : ''}
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
              <span className="text-xs text-slate-600">
                {item.nombreComercialEmpresa}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'estado',
      header: 'Estado',
      align: 'right',
      render: (item) => <RepartidorEstadoBadge estado={item.estado} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${meQuery.data?.nombre ?? storedUser?.nombre ?? 'Operador'}`}
        description={
          isAdmin
            ? 'Supervisión global de empresas, repartidores y pedidos en curso.'
            : `Gestión operativa de ${empresas[0]?.nombreComercial ?? 'tu empresa'}.`
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={handleRefreshAll}
              loading={isRefreshing}
              leftIcon={<RefreshCw className="h-4 w-4" strokeWidth={1.75} />}
            >
              Actualizar
            </Button>
            <Link to="/pedidos">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="h-4 w-4" strokeWidth={2} />}
              >
                Gestionar pedidos
              </Button>
            </Link>
          </>
        }
      />

      {/* Resumen operativo en tira estructurada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Pedidos en curso</span>
            <ClipboardList className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {pedidosQuery.isLoading ? '—' : pedidosActivos.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            De {pedidos.length} pedidos registrados
          </p>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Pedidos entregados</span>
            <UserCheck className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {pedidosQuery.isLoading ? '—' : pedidosEntregados.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            Total facturado: {formatCurrency(importeTotalEntregado)}
          </p>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Repartidores disponibles</span>
            <Truck className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {repartidoresQuery.isLoading ? '—' : repartidoresDisponibles.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            Flota total: {repartidores.length} repartidores
          </p>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>{isAdmin ? 'Empresas activas' : 'Estado de cuenta'}</span>
            <Building2 className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          </div>
          {isAdmin ? (
            <>
              <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                {empresasQuery.isLoading ? '—' : empresasActivas.length}
              </p>
              <p className="mt-1 text-xs text-slate-500 tabular-nums">
                De {empresas.length} empresas registradas
              </p>
            </>
          ) : (
            <>
              <div className="mt-2.5">
                <Badge
                  tone={empresas[0]?.activo !== false ? 'success' : 'danger'}
                  dot
                >
                  {empresas[0]?.activo !== false ? 'Empresa activa' : 'Inactiva'}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500 truncate">
                {empresas[0]?.nombreComercial ?? storedUser?.email}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Contenido en 2 columnas asimétricas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Pedidos recientes
            </h3>
            <Link
              to="/pedidos"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Ver todos los pedidos
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </div>

          <Table
            data={recentPedidos}
            columns={pedidoColumns}
            keyExtractor={(item) => item.id}
            loading={pedidosQuery.isLoading}
            skeletonRows={4}
            emptyTitle="Aún no hay pedidos registrados"
            emptyDescription="Crea tu primer pedido desde el módulo de Pedidos para comenzar el despacho."
            emptyAction={
              <Link to="/pedidos">
                <Button size="sm" variant="primary">
                  Ir a Pedidos
                </Button>
              </Link>
            }
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Estado de repartidores
            </h3>
            <Link
              to="/repartidores"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Administrar flota
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </div>

          <Table
            data={repartidores.slice(0, 6)}
            columns={repartidorColumns}
            keyExtractor={(item) => item.id}
            loading={repartidoresQuery.isLoading}
            skeletonRows={4}
            emptyTitle="Sin repartidores registrados"
            emptyDescription="Registra repartidores para asignarlos a las entregas."
            emptyAction={
              <Link to="/repartidores">
                <Button size="sm" variant="secondary">
                  Registrar repartidor
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    </div>
  );
}
