import {
  AlertTriangle,
  Building2,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  MessageSquareWarning,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import type { RolUsuario } from '../../types';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: RolUsuario[];
  section: 'principal' | 'operaciones' | 'control';
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Resumen',
    to: '/',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'EMPRESA'],
    section: 'principal',
  },
  {
    label: 'Empresas',
    to: '/empresas',
    icon: Building2,
    roles: ['ADMIN', 'EMPRESA'],
    section: 'operaciones',
  },
  {
    label: 'Repartidores',
    to: '/repartidores',
    icon: Truck,
    roles: ['ADMIN', 'EMPRESA'],
    section: 'operaciones',
  },
  {
    label: 'Pedidos',
    to: '/pedidos',
    icon: ClipboardList,
    roles: ['ADMIN', 'EMPRESA'],
    section: 'operaciones',
  },
  {
    label: 'Seguimiento',
    to: '/seguimiento',
    icon: MapPin,
    roles: ['ADMIN', 'EMPRESA'],
    section: 'operaciones',
  },
  {
    label: 'Reclamos',
    to: '/reclamos',
    icon: MessageSquareWarning,
    roles: ['ADMIN', 'EMPRESA'],
    section: 'control',
  },
  {
    label: 'Alertas',
    to: '/alertas',
    icon: AlertTriangle,
    roles: ['ADMIN'],
    section: 'control',
  },
  {
    label: 'Auditoría',
    to: '/auditoria',
    icon: ShieldCheck,
    roles: ['ADMIN'],
    section: 'control',
  },
];

export const ROUTE_TITLES: Record<string, string> = {
  '/': 'Resumen general',
  '/empresas': 'Empresas',
  '/repartidores': 'Repartidores',
  '/pedidos': 'Pedidos',
  '/seguimiento': 'Seguimiento y ubicaciones',
  '/reclamos': 'Reclamos e incidencias',
  '/alertas': 'Alertas de fraude',
  '/auditoria': 'Registro de auditoría',
};
