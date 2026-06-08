import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import VerifiedRoute from '@/components/auth/VerifiedRoute';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import ProfilePage from '@/features/perfil/ProfilePage';
import ProfileEditPage from '@/features/perfil/ProfileEditPage';
import DocumentUploadPage from '@/features/verificacion/DocumentUploadPage';
import AdminVerificacionesPage from '@/features/admin/AdminVerificacionesPage';
import AdminOfertasPage from '@/features/admin/AdminOfertasPage';
import ExplorarPage from '@/features/ofertas/ExplorarPage';
import OfertaDetallePage from '@/features/ofertas/OfertaDetallePage';
import CrearOfertaPage from '@/features/ofertas/CrearOfertaPage';
import EditarOfertaPage from '@/features/ofertas/EditarOfertaPage';
import MisOfertasPage from '@/features/ofertas/MisOfertasPage';

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
        <Route path="/ofertas/:id" element={<OfertaDetallePage />} />

        {/* Rutas que requieren verificación */}
        <Route element={<VerifiedRoute />}>
          <Route path="/" element={<ExplorarPage />} />
          <Route path="/ofertas/nueva" element={<CrearOfertaPage />} />
          <Route path="/ofertas/:id/editar" element={<EditarOfertaPage />} />
          <Route path="/mis-ofertas" element={<MisOfertasPage />} />
        </Route>

        {/* Rutas admin */}
        <Route element={<ProtectedRoute requiredRoles={['moderador', 'super_admin']} />}>
          <Route path="/admin/verificaciones" element={<AdminVerificacionesPage />} />
          <Route path="/admin/ofertas" element={<AdminOfertasPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
