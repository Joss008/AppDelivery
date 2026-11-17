import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  Clock,
  MapPin,
  PackageOpen,
  RefreshCw,
  Search,
  Store,
} from 'lucide-react';
import { pwaPedidosApi } from '../api';
import { Input, PedidoEstadoBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import type { PedidoResponse } from '../types';

type FiltroTab = 'ACTIVOS' | 'DISPONIBLES' | 'ENTREGADOS' | 'TODOS';

const TABS: { key: FiltroTab; label: string }[] = [
  { key: 'ACTIVOS', label: 'En curso' },
  { key: 'DISPONIBLES', label: 'Disponibles' },
  { key: 'ENTREGADOS', label: 'Entregados' },
  { key: 'TODOS', label: 'Todos' },
];

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

export function SolicitudesPage() {
  const navigate = useNavigate();
  const { driver } = useAuth();
  const [tab, setTab] = useState<FiltroTab>('ACTIVOS');
  const [search, setSearch] = useState('');

  const pedidosQuery = useQuery({
    queryKey: ['pwa-pedidos'],
    queryFn: () => pwaPedidosApi.listar(),
    refetchInterval: 12000,
  });

  const pedidos = pedidosQuery.data ?? [];

  const matchesTab = (p: PedidoResponse): boolean => {
    if (tab === 'ACTIVOS') {
      return (
        p.repartidorId === driver?.id &&
        (p.estado === 'ACEPTADO' ||
          p.estado === 'PREPARANDO' ||
          p.estado === 'LISTO' ||
          p.estado === 'EN_CAMINO')
      );
    }
    if (tab === 'DISPONIBLES') {
      return (
        p.estado === 'PENDIENTE' &&
        (p.repartidorId === null || p.repartidorId === driver?.id)
      );
    }
    if (tab === 'ENTREGADOS') {
      return p.repartidorId === driver?.id && p.estado === 'ENTREGADO';
    }
    return true;
  };

  const filtered = pedidos.filter((p) => {
    if (!matchesTab(p)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(p.id).includes(q) ||
      p.nombreCliente.toLowerCase().includes(q) ||
      p.direccionEntrega.toLowerCase().includes(q) ||
      (p.descripcion ?? '').toLowerCase().includes(q)
    );
  });

  const counts: Record<FiltroTab, number> = {
    ACTIVOS: pedidos.filter(
      (p) =>
        p.repartidorId === driver?.id &&
        (p.estado === 'ACEPTADO' ||
          p.estado === 'PREPARANDO' ||
          p.estado === 'LISTO' ||
          p.estado === 'EN_CAMINO')
    ).length,
    DISPONIBLES: pedidos.filter(
      (p) =>
        p.estado === 'PENDIENTE' &&
        (p.repartidorId === null || p.repartidorId === driver?.id)
    ).length,
    ENTREGADOS: pedidos.filter(
      (p) => p.repartidorId === driver?.id && p.estado === 'ENTREGADO'
    ).length,
    TODOS: pedidos.length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Solicitudes y entregas
          </h2>
          <p className="text-xs text-slate-500">
            Gestiona tus pedidos asignados y revisa el historial
          </p>
        </div>

        <button
          type="button"
          onClick={() => void pedidosQuery.refetch()}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              pedidosQuery.isFetching ? 'animate-spin text-blue-600' : ''
            }`}
            strokeWidth={1.8}
          />
          Sincronizar
        </button>
      </div>

      {/* Buscador */}
      <Input
        label="Buscar pedido"
        placeholder="N° de pedido, cliente o dirección..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftAdornment={<Search className="h-4 w-4" strokeWidth={1.8} />}
      />

      {/* Tabs de filtro */}
      <div
        role="tablist"
        aria-label="Filtrar pedidos por estado"
        className="grid grid-cols-4 gap-1 rounded-xl bg-slate-200/75 p-1"
      >
        {TABS.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(item.key)}
              className={[
                'flex flex-col items-center justify-center rounded-lg py-1.5 px-1 text-[11px] font-medium select-none cursor-pointer',
                'transition-[background-color,color,box-shadow,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.97]',
                active
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              <span className="truncate">{item.label}</span>
              <span
                className={`text-[10px] tabular-nums ${
                  active ? 'text-blue-600 font-bold' : 'text-slate-400'
                }`}
              >
                {counts[item.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lista de Pedidos */}
      {pedidosQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-32 rounded-2xl border border-slate-200 bg-white p-4 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto h-10 w-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2.5">
            <PackageOpen className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <p className="text-sm font-semibold text-slate-900">
            Sin pedidos en esta bandeja
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Prueba cambiando de pestaña o limpiando el filtro de búsqueda.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((pedido) => (
            <article
              key={pedido.id}
              onClick={() => navigate(`/solicitudes/${pedido.id}`)}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs cursor-pointer transition-[transform,border-color,background-color] duration-150 ease-[var(--ease-out)] active:scale-[0.99] hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 tabular-nums">
                      #{pedido.id}
                    </span>
                    <PedidoEstadoBadge estado={pedido.estado} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {pedido.nombreCliente}
                  </h3>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatCurrency(pedido.importe)}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-400 tabular-nums">
                    <Clock className="h-3 w-3" strokeWidth={1.8} />
                    {formatDateTime(pedido.fechaCreacion)}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-start gap-1.5">
                  <Store
                    className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5"
                    strokeWidth={1.8}
                  />
                  <span className="truncate">
                    {pedido.nombreComercialEmpresa} ·{' '}
                    {pedido.direccionRecojo || 'Local principal'}
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <MapPin
                    className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5"
                    strokeWidth={1.8}
                  />
                  <span className="font-medium text-slate-800 line-clamp-1">
                    {pedido.direccionEntrega}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-blue-600">
                <span>Abrir ficha operativa</span>
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
