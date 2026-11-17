import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Phone, ShieldCheck, Truck } from 'lucide-react';
import { extractApiError } from '../api';
import { Button, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (isAuthenticated) {
    return <Navigate to="/inicio" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const cleanId = identificador.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setFieldErrors({ identificador: 'Ingresa tu teléfono o DNI.' });
      return;
    }
    if (!cleanPass) {
      setFieldErrors({ password: 'Ingresa tu contraseña de acceso.' });
      return;
    }

    setLoading(true);
    try {
      await login({ identificador: cleanId, password: cleanPass });
      navigate('/inicio', { replace: true });
    } catch (err) {
      const apiErr = extractApiError(err);
      setError(apiErr.message);
      setFieldErrors(apiErr.campos ?? {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-100/80 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm mb-3.5">
            <Truck className="h-7 w-7" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Delivery Repartidor
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-[270px]">
            Plataforma móvil de despacho, seguimiento GPS y confirmación de entregas en tiempo real
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Teléfono o DNI"
              placeholder="Ej. 987654321 o 72345678"
              autoComplete="username"
              inputMode="tel"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              error={fieldErrors.identificador}
              leftAdornment={<Phone className="h-4 w-4" strokeWidth={1.8} />}
              className="tabular-nums"
              required
            />

            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              leftAdornment={<KeyRound className="h-4 w-4" strokeWidth={1.8} />}
              rightAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={
                    showPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.8} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.8} />
                  )}
                </button>
              }
              required
            />

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Iniciar turno operativo
            </Button>
          </form>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-500">
            <ShieldCheck
              className="h-4 w-4 text-blue-600 shrink-0 mt-0.5"
              strokeWidth={1.8}
            />
            <p className="leading-relaxed">
              Si es tu primer ingreso y tu empresa no asignó una clave personalizada, usa tu número de <strong className="font-semibold text-slate-700">DNI</strong> como contraseña.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
