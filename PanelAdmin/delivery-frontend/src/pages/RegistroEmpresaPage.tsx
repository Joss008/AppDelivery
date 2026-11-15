import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PackageCheck } from 'lucide-react';
import { empresasApi, extractApiError } from '../api';
import { Button, Input } from '../components/ui';

export function RegistroEmpresaPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      await empresasApi.registrar({
        nombre: nombre.trim(),
        nombreComercial: nombreComercial.trim(),
        email: email.trim(),
        password,
        telefono: telefono.trim() || undefined,
        direccion: direccion.trim() || undefined,
      });
      navigate('/login', { replace: true });
    } catch (err) {
      const apiErr = extractApiError(err);
      setError(apiErr.message);
      if (apiErr.campos) {
        setFieldErrors(apiErr.campos);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
            <PackageCheck className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 leading-tight">
              Registrar empresa
            </h1>
            <p className="text-xs text-slate-500">
              Crea una cuenta para gestionar tus pedidos y repartidores
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre del responsable"
            placeholder="Juan Pérez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            error={fieldErrors.nombre}
            required
          />

          <Input
            label="Nombre comercial"
            placeholder="Restaurante Central"
            value={nombreComercial}
            onChange={(e) => setNombreComercial(e.target.value)}
            error={fieldErrors.nombreComercial}
            required
          />

          <Input
            label="Correo electrónico"
            type="email"
            placeholder="contacto@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            required
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 8 caracteres"
            helperText="Debe tener al menos 8 caracteres."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              placeholder="999 888 777"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              error={fieldErrors.telefono}
            />
            <Input
              label="Dirección"
              placeholder="Av. Principal 123"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              error={fieldErrors.direccion}
            />
          </div>

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
            Crear cuenta de empresa
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          ¿Ya tienes una cuenta?{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline underline-offset-2"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
