import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { MobileLayout } from './components/layout/MobileLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GeoProvider } from './context/GeoContext';
import { InicioPage } from './pages/InicioPage';
import { LoginPage } from './pages/LoginPage';
import { PedidoDetallePage } from './pages/PedidoDetallePage';
import { PerfilPage } from './pages/PerfilPage';
import { SolicitudesPage } from './pages/SolicitudesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

function ProtectedRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-2 bg-slate-50 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" strokeWidth={2} />
        <p className="text-xs font-medium">Verificando sesión operativa...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MobileLayout />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GeoProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoutes />}>
                <Route path="/inicio" element={<InicioPage />} />
                <Route path="/solicitudes" element={<SolicitudesPage />} />
                <Route
                  path="/solicitudes/:id"
                  element={<PedidoDetallePage />}
                />
                <Route path="/perfil" element={<PerfilPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/inicio" replace />} />
            </Routes>
          </BrowserRouter>
        </GeoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
