import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function VerifiedRoute() {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;

  if (user.estado_verificacion !== 'verificado') {
    return <Navigate to="/perfil" replace />;
  }

  return <Outlet />;
}
