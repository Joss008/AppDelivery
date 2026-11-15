import type { ReactNode } from 'react';
import type { EstadoPedido, EstadoReclamo, EstadoRepartidor } from '../../types';

export type BadgeTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
};

const DOT_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-500',
  info: 'bg-blue-600',
  success: 'bg-emerald-600',
  warning: 'bg-amber-500',
  danger: 'bg-rose-600',
};

export function Badge({
  tone = 'neutral',
  dot = false,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE_CLASSES[tone],
        className,
      ].join(' ')}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${DOT_CLASSES[tone]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

const PEDIDO_TONE_MAP: Record<EstadoPedido, { tone: BadgeTone; label: string }> = {
  PENDIENTE: { tone: 'warning', label: 'Pendiente' },
  ACEPTADO: { tone: 'info', label: 'Aceptado' },
  PREPARANDO: { tone: 'info', label: 'Preparando' },
  LISTO: { tone: 'info', label: 'Listo' },
  EN_CAMINO: { tone: 'warning', label: 'En camino' },
  ENTREGADO: { tone: 'success', label: 'Entregado' },
  CANCELADO: { tone: 'neutral', label: 'Cancelado' },
  RECHAZADO: { tone: 'danger', label: 'Rechazado' },
};

export function PedidoEstadoBadge({ estado }: { estado: EstadoPedido }) {
  const config = PEDIDO_TONE_MAP[estado] ?? { tone: 'neutral', label: estado };
  return (
    <Badge tone={config.tone} dot>
      {config.label}
    </Badge>
  );
}

const REPARTIDOR_TONE_MAP: Record<
  EstadoRepartidor,
  { tone: BadgeTone; label: string }
> = {
  DISPONIBLE: { tone: 'success', label: 'Disponible' },
  OCUPADO: { tone: 'warning', label: 'Ocupado' },
  INACTIVO: { tone: 'neutral', label: 'Inactivo' },
};

export function RepartidorEstadoBadge({
  estado,
}: {
  estado: EstadoRepartidor;
}) {
  const config = REPARTIDOR_TONE_MAP[estado] ?? {
    tone: 'neutral',
    label: estado,
  };
  return (
    <Badge tone={config.tone} dot>
      {config.label}
    </Badge>
  );
}

const RECLAMO_TONE_MAP: Record<
  EstadoReclamo,
  { tone: BadgeTone; label: string }
> = {
  PENDIENTE: { tone: 'warning', label: 'Pendiente' },
  EN_PROCESO: { tone: 'info', label: 'En proceso' },
  RESUELTO: { tone: 'success', label: 'Resuelto' },
  RECHAZADO: { tone: 'danger', label: 'Rechazado' },
};

export function ReclamoEstadoBadge({ estado }: { estado: EstadoReclamo }) {
  const config = RECLAMO_TONE_MAP[estado] ?? { tone: 'neutral', label: estado };
  return (
    <Badge tone={config.tone} dot>
      {config.label}
    </Badge>
  );
}
