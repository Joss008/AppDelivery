import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { getStoredUser } from '../../api';
import { Badge } from '../ui/Badge';
import { ROUTE_TITLES } from './navConfig';

export interface NavbarProps {
  onOpenMobileMenu: () => void;
}

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
  const { pathname } = useLocation();
  const user = getStoredUser();

  const pageTitle = ROUTE_TITLES[pathname] ?? 'Panel Delivery';

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-xs px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menú de navegación"
          className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 cursor-pointer"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>

        <h1 className="text-base font-semibold text-slate-900 truncate">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {user && (
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline text-xs text-slate-600 font-medium">
              {user.nombre}
            </span>
            <Badge tone={user.rol === 'ADMIN' ? 'info' : 'neutral'}>
              {user.rol}
            </Badge>
          </div>
        )}
      </div>
    </header>
  );
}
