import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout';
import { AlertasPage } from '../pages/AlertasPage';
import { AuditoriaPage } from '../pages/AuditoriaPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EmpresasPage } from '../pages/EmpresasPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/ModulePlaceholder';
import { PedidosPage } from '../pages/PedidosPage';
import { ReclamosPage } from '../pages/ReclamosPage';
import { RegistroEmpresaPage } from '../pages/RegistroEmpresaPage';
import { RepartidoresPage } from '../pages/RepartidoresPage';
import { SeguimientoPage } from '../pages/SeguimientoPage';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroEmpresaPage />} />
        </Route>

        {/* Rutas protegidas (ADMIN y EMPRESA) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'EMPRESA']} />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/empresas" element={<EmpresasPage />} />
            <Route path="/repartidores" element={<RepartidoresPage />} />
            <Route path="/pedidos" element={<PedidosPage />} />
            <Route path="/seguimiento" element={<SeguimientoPage />} />
            <Route path="/reclamos" element={<ReclamosPage />} />

            {/* Rutas exclusivas de ADMIN */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/alertas" element={<AlertasPage />} />
              <Route path="/auditoria" element={<AuditoriaPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
