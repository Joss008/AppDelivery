import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui';

export interface ModulePlaceholderProps {
  title: string;
  description: string;
}

export function ModulePlaceholder({
  title,
  description,
}: ModulePlaceholderProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Vista lista para conectar con los servicios de <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">src/api.ts</code>.
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="min-h-[60dvh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        404
      </p>
      <h2 className="mt-2 text-lg font-semibold text-slate-900">
        Página no encontrada
      </h2>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">
        La ruta solicitada no existe o no tienes acceso a ella.
      </p>
      <div className="mt-5">
        <Link to="/">
          <Button variant="secondary">Volver al resumen</Button>
        </Link>
      </div>
    </div>
  );
}
