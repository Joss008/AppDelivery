import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Home, Navigation, Truck, User } from 'lucide-react';
import { pwaPedidosApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useGeo } from '../../context/GeoContext';
import { RepartidorEstadoBadge } from '../ui';

export function MobileLayout() {
  const { driver } = useAuth();
  const { isTracking, setHasActiveOrder } = useGeo();

  const pedidosQuery = useQuery({
    queryKey: ['pwa-pedidos'],
    queryFn: () => pwaPedidosApi.listar(),
    refetchInterval: 15000,
  });

  const pedidos = pedidosQuery.data ?? [];

  const disponiblesCount = pedidos.filter(
    (p) => p.estado === 'PENDIENTE' && p.repartidorId === null
  ).length;

  const activosCount = pedidos.filter(
    (p) =>
      p.repartidorId === driver?.id &&
      (p.estado === 'ACEPTADO' ||
        p.estado === 'PREPARANDO' ||
        p.estado === 'LISTO' ||
        p.estado === 'EN_CAMINO')
  ).length;

  useEffect(() => {
    setHasActiveOrder(activosCount > 0);
  }, [activosCount, setHasActiveOrder]);

  return (
    <div className="min-h-[100dvh] bg-slate-100/80 flex flex-col items-center">
      <div className="w-full max-w-md min-h-[100dvh] bg-slate-50 border-x border-slate-200/80 flex flex-col relative shadow-xs">
        {/* Top Operational Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Truck className="h-4.5 w-4.5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 truncate">
                {driver?.nombreComercialEmpresa ?? 'Panel Operativo'}
              </p>
              <h1 className="text-sm font-semibold text-slate-900 truncate">
                {driver?.nombre ?? 'Repartidor'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              title={
                isTracking
                  ? 'GPS transmitiendo en tiempo real'
                  : 'GPS fuera de servicio'
              }
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                isTracking
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <Navigation
                className={`h-3 w-3 ${isTracking ? 'text-emerald-600' : 'text-slate-400'}`}
                strokeWidth={2}
              />
              GPS
            </span>
            {driver && <RepartidorEstadoBadge estado={driver.estado} />}
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 px-4 pt-4 pb-24">
          <Outlet />
        </main>

        {/* Bottom Navigation Bar */}
        <nav
          aria-label="Navegación principal del repartidor"
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 grid grid-cols-3 gap-1"
        >
          <NavLink
            to="/inicio"
            className={({ isActive }) =>
              [
                'relative flex flex-col items-center justify-center py-1.5 rounded-xl text-xs font-medium select-none',
                'transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.96]',
                isActive
                  ? 'text-blue-600 bg-blue-50/80 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70',
              ].join(' ')
            }
          >
            <Home className="h-5 w-5 mb-0.5" strokeWidth={1.9} />
            <span>Inicio</span>
          </NavLink>

          <NavLink
            to="/solicitudes"
            className={({ isActive }) =>
              [
                'relative flex flex-col items-center justify-center py-1.5 rounded-xl text-xs font-medium select-none',
                'transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.96]',
                isActive
                  ? 'text-blue-600 bg-blue-50/80 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70',
              ].join(' ')
            }
          >
            <div className="relative">
              <ClipboardList className="h-5 w-5 mb-0.5" strokeWidth={1.9} />
              {(activosCount > 0 || disponiblesCount > 0) && (
                <span
                  className={`absolute -top-1 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums text-white ${
                    activosCount > 0 ? 'bg-blue-600' : 'bg-amber-500'
                  }`}
                >
                  {activosCount > 0 ? activosCount : disponiblesCount}
                </span>
              )}
            </div>
            <span>Solicitudes</span>
          </NavLink>

          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              [
                'relative flex flex-col items-center justify-center py-1.5 rounded-xl text-xs font-medium select-none',
                'transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.96]',
                isActive
                  ? 'text-blue-600 bg-blue-50/80 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70',
              ].join(' ')
            }
          >
            <User className="h-5 w-5 mb-0.5" strokeWidth={1.9} />
            <span>Perfil</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
