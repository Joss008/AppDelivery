import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getAuthToken, getStoredUser } from '../api';
import type { RolUsuario } from '../types';

export interface ProtectedRouteProps {
  allowedRoles?: RolUsuario[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getAuthToken();
  const user = getStoredUser();

  useEffect(() => {
    const handleUnauthorized = () => {
      navigate('/login', { replace: true, state: { from: location } });
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [navigate, location]);

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const token = getAuthToken();
  const user = getStoredUser();

  if (token && user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
