import type { EstadoPedido, EstadoRepartidor } from '../../types';

export type BadgeTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
};

const dotClasses: Record<BadgeTone, string> = {
  neutral: 'bg-slate-400',
  info: 'bg-blue-600',
  success: 'bg-emerald-600',
  warning: 'bg-amber-500',
  danger: 'bg-rose-600',
};

export interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  tone = 'neutral',
  dot = false,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5 select-none',
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClasses[tone]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

const PEDIDO_META: Record<
  EstadoPedido,
  { label: string; tone: BadgeTone }
> = {
  PENDIENTE: { label: 'Disponible', tone: 'warning' },
  ACEPTADO: { label: 'Aceptado', tone: 'info' },
  PREPARANDO: { label: 'Preparando', tone: 'info' },
  LISTO: { label: 'Listo recojo', tone: 'info' },
  EN_CAMINO: { label: 'En camino', tone: 'info' },
  ENTREGADO: { label: 'Entregado', tone: 'success' },
  CANCELADO: { label: 'Cancelado', tone: 'danger' },
  RECHAZADO: { label: 'Rechazado', tone: 'danger' },
};

export function PedidoEstadoBadge({ estado }: { estado: EstadoPedido }) {
  const meta = PEDIDO_META[estado] ?? {
    label: estado,
    tone: 'neutral' as const,
  };
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}

const REPARTIDOR_META: Record<
  EstadoRepartidor,
  { label: string; tone: BadgeTone }
> = {
  DISPONIBLE: { label: 'Disponible', tone: 'success' },
  OCUPADO: { label: 'En entrega', tone: 'info' },
  INACTIVO: { label: 'Fuera de turno', tone: 'neutral' },
};

export function RepartidorEstadoBadge({
  estado,
}: {
  estado: EstadoRepartidor;
}) {
  const meta = REPARTIDOR_META[estado] ?? {
    label: estado,
    tone: 'neutral' as const,
  };
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
