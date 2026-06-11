import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AppLayout from '@/components/layout/AppLayout';

interface Props {
  requiredRoles?: string[];
  noLayout?: boolean;
}

export default function ProtectedRoute({ requiredRoles, noLayout }: Props) {
  const { user, loading, initialized } = useAuthStore();

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    // super_admin satisface cualquier requisito (mismo criterio que el backend RbacFilter).
    const isSuperAdmin = user.roles.includes('super_admin');
    const hasRole = isSuperAdmin || requiredRoles.some((r) => user.roles.includes(r));
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  if (noLayout) return <Outlet />;

  return <AppLayout />;
}
