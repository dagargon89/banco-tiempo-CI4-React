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
import AdminUsuariosPage from '@/features/admin/AdminUsuariosPage';
import AdminTicketsPage from '@/features/admin/AdminTicketsPage';
import AdminMetricasPage from '@/features/admin/AdminMetricasPage';
import AdminCategoriasPage from '@/features/admin/AdminCategoriasPage';
import AdminModeradoresPage from '@/features/admin/AdminModeradoresPage';
import TicketCrearPage from '@/features/tickets/TicketCrearPage';
import MisTicketsPage from '@/features/tickets/MisTicketsPage';
import ExplorarPage from '@/features/ofertas/ExplorarPage';
import OfertaDetallePage from '@/features/ofertas/OfertaDetallePage';
import CrearOfertaPage from '@/features/ofertas/CrearOfertaPage';
import EditarOfertaPage from '@/features/ofertas/EditarOfertaPage';
import MisOfertasPage from '@/features/ofertas/MisOfertasPage';
import VinculacionesPage from '@/features/vinculaciones/VinculacionesPage';
import VinculacionDetallePage from '@/features/vinculaciones/VinculacionDetallePage';
import MensajesPage from '@/features/chat/MensajesPage';
import AvisoPrivacidadPage from '@/features/legal/AvisoPrivacidadPage';
import WelcomePage from '@/features/landing/WelcomePage';

export default function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, [init]);

  return (
    <Routes>
      {/* Landing pública */}
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/privacidad" element={<AvisoPrivacidadPage />} />

      {/* Todas las rutas autenticadas usan AppLayout via ProtectedRoute */}
      <Route element={<ProtectedRoute />}>
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/perfil/editar" element={<ProfileEditPage />} />
        <Route path="/verificacion" element={<DocumentUploadPage />} />
        <Route path="/ofertas/:id" element={<OfertaDetallePage />} />

        {/* Rutas que requieren verificacion */}
        <Route element={<VerifiedRoute />}>
          <Route path="/inicio" element={<ExplorarPage />} />
          <Route path="/ofertas/nueva" element={<CrearOfertaPage />} />
          <Route path="/ofertas/:id/editar" element={<EditarOfertaPage />} />
          <Route path="/mis-ofertas" element={<MisOfertasPage />} />
          <Route path="/vinculaciones" element={<VinculacionesPage />} />
          <Route path="/vinculaciones/:id" element={<VinculacionDetallePage />} />
          <Route path="/mensajes" element={<MensajesPage />} />
          <Route path="/tickets/crear" element={<TicketCrearPage />} />
          <Route path="/mis-tickets" element={<MisTicketsPage />} />
        </Route>

        {/* Rutas admin (RBAC por ruta — super_admin satisface todo) */}
        <Route element={<ProtectedRoute requiredRoles={['moderador', 'verificador']} noLayout />}>
          <Route path="/admin/verificaciones" element={<AdminVerificacionesPage />} />
        </Route>
        <Route element={<ProtectedRoute requiredRoles={['moderador']} noLayout />}>
          <Route path="/admin/ofertas" element={<AdminOfertasPage />} />
        </Route>
        <Route element={<ProtectedRoute requiredRoles={['moderador']} noLayout />}>
          <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
        </Route>
        <Route element={<ProtectedRoute requiredRoles={['moderador', 'soporte']} noLayout />}>
          <Route path="/admin/tickets" element={<AdminTicketsPage />} />
        </Route>
        <Route element={<ProtectedRoute requiredRoles={['moderador', 'analista']} noLayout />}>
          <Route path="/admin/metricas" element={<AdminMetricasPage />} />
        </Route>
        <Route element={<ProtectedRoute requiredRoles={['editor_categorias']} noLayout />}>
          <Route path="/admin/categorias" element={<AdminCategoriasPage />} />
        </Route>

        {/* Super admin only */}
        <Route element={<ProtectedRoute requiredRoles={['super_admin']} noLayout />}>
          <Route path="/admin/moderadores" element={<AdminModeradoresPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
