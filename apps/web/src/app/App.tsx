import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import VerifiedRoute from '@/components/auth/VerifiedRoute';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import DashboardPage from '@/features/auth/DashboardPage';
import ProfilePage from '@/features/perfil/ProfilePage';
import ProfileEditPage from '@/features/perfil/ProfileEditPage';
import DocumentUploadPage from '@/features/verificacion/DocumentUploadPage';
import AdminVerificacionesPage from '@/features/admin/AdminVerificacionesPage';

export default function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, [init]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />

      {/* Rutas autenticadas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/perfil/editar" element={<ProfileEditPage />} />
        <Route path="/verificacion" element={<DocumentUploadPage />} />

        {/* Rutas que requieren verificación */}
        <Route element={<VerifiedRoute />}>
          <Route path="/" element={<DashboardPage />} />
        </Route>

        {/* Rutas admin */}
        <Route element={<ProtectedRoute requiredRoles={['moderador', 'super_admin']} />}>
          <Route path="/admin/verificaciones" element={<AdminVerificacionesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
