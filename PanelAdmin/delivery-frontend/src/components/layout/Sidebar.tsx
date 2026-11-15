import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, PackageCheck, X } from 'lucide-react';
import { authApi, getStoredUser } from '../../api';
import { NAV_ITEMS, type NavItem } from './navConfig';

export interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const SECTION_LABELS: Record<NavItem['section'], string> = {
  principal: 'General',
  operaciones: 'Operaciones',
  control: 'Supervisión',
};

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const userRole = user?.rol ?? 'EMPRESA';

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  const sections: NavItem['section'][] = ['principal', 'operaciones', 'control'];

  const handleLogout = () => {
    authApi.logout();
    onCloseMobile();
    navigate('/login', { replace: true });
  };

  const navContent = (
    <div className="flex h-full flex-col bg-slate-50 border-r border-slate-200 select-none">
      {/* Brand */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
            <PackageCheck className="h-4.5 w-4.5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
              AppDelivery
            </p>
            <p className="text-[11px] text-slate-500 truncate leading-tight">
              Panel Operativo
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Cerrar menú"
          className="lg:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 cursor-pointer"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Navegación principal"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-5"
      >
        {sections.map((section) => {
          const items = visibleItems.filter((i) => i.section === section);
          if (items.length === 0) return null;

          return (
            <div key={section}>
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {SECTION_LABELS[section]}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const label =
                    item.to === '/empresas' && userRole === 'EMPRESA'
                      ? 'Mi empresa'
                      : item.label;

                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/'}
                        onClick={onCloseMobile}
                        className={({ isActive }) =>
                          [
                            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ease-out whitespace-nowrap',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30',
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 font-normal',
                          ].join(' ')
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer / User */}
      <div className="border-t border-slate-200/80 p-3">
        <div className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-900 truncate">
              {user?.nombre ?? 'Usuario'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {user?.email ?? 'Sesión activa'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30 cursor-pointer shrink-0"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-60">
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 animate-backdrop-enter"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-64 max-w-[80vw] h-full animate-drawer-enter">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
