import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PackageCheck } from 'lucide-react';
import { authApi, extractApiError } from '../api';
import { Button, Input } from '../components/ui';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.login({ email: email.trim(), password });
      navigate('/', { replace: true });
    } catch (err) {
      const apiErr = extractApiError(err);
      setError(apiErr.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
            <PackageCheck className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 leading-tight">
              Iniciar sesión
            </h1>
            <p className="text-xs text-slate-500">
              Panel operativo AppDelivery
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            placeholder="admin@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
          >
            Entrar al panel
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          ¿Tu empresa aún no tiene cuenta?{' '}
          <Link
            to="/registro"
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline underline-offset-2"
          >
            Registrar empresa
          </Link>
        </p>
      </div>
    </div>
  );
}
