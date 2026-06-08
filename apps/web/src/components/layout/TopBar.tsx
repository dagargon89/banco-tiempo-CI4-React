import { Link, useLocation } from 'react-router-dom';
import { Search, Plus, Shield, Bell } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';

export default function TopBar() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuthStore();
  const { pathname } = useLocation();

  const isOferente = pathname.startsWith('/mis-ofertas') || pathname.startsWith('/panel') || pathname.startsWith('/ofertas/nueva');
  const isAdmin = pathname.startsWith('/admin');

  // Breadcrumb
  const breadcrumb = (() => {
    if (isAdmin) {
      if (pathname.includes('verificaciones')) return { section: 'Administrador', page: 'Verificaciones' };
      if (pathname.includes('ofertas')) return { section: 'Administrador', page: 'Ofertas' };
      return { section: 'Administrador', page: 'Panel' };
    }
    if (isOferente) return { section: 'Oferente', page: 'Panel del oferente' };
    if (pathname.startsWith('/ofertas/')) return { section: 'Buscador', page: 'Detalle de oferta' };
    if (pathname.startsWith('/perfil')) return { section: 'Buscador', page: 'Mi perfil' };
    if (pathname.startsWith('/verificacion')) return { section: 'Buscador', page: 'Verificacion' };
    return { section: 'Buscador', page: 'Explorar' };
  })();

  const esAdmin = user?.roles.includes('moderador') || user?.roles.includes('super_admin');

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-3">{breadcrumb.section}</span>
        <span className="text-text-3">&gt;</span>
        <span className="font-medium text-text-1">{breadcrumb.page}</span>
      </div>

      {/* Right side: role switcher + avatar */}
      <div className="flex items-center gap-4">
        {/* Role switcher tabs */}
        <div className="flex items-center rounded-lg border border-border bg-surface-2 p-0.5">
          <Link
            to="/"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              !isOferente && !isAdmin ? 'bg-surface text-text-1 shadow-sm' : 'text-text-3 hover:text-text-2'
            }`}
          >
            <Search className="h-3.5 w-3.5" /> Buscador
          </Link>
          <Link
            to="/mis-ofertas"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              isOferente ? 'bg-accent text-white shadow-sm' : 'text-text-3 hover:text-text-2'
            }`}
          >
            <Plus className="h-3.5 w-3.5" /> Oferente
          </Link>
          {esAdmin && (
            <Link
              to="/admin/ofertas"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                isAdmin ? 'bg-surface text-text-1 shadow-sm' : 'text-text-3 hover:text-text-2'
              }`}
            >
              <Shield className="h-3.5 w-3.5" /> Administrador
            </Link>
          )}
        </div>

        {/* Notifications */}
        <button className="relative rounded-md p-1.5 text-text-3 transition-colors hover:bg-surface-2 hover:text-text-1">
          <Bell className="h-4.5 w-4.5" />
        </button>

        {/* Avatar dropdown */}
        {user && (
          <div className="group relative">
            <button className="flex items-center">
              <Avatar src={user.foto_perfil} nombre={user.nombre} size="sm" />
            </button>
            <div className="absolute right-0 top-full z-50 mt-1 hidden min-w-[140px] rounded-md border border-border bg-surface py-1 shadow-lg group-hover:block">
              <Link to="/perfil" className="block px-4 py-2 text-sm text-text-2 hover:bg-surface-2">Mi perfil</Link>
              <button onClick={logout} className="block w-full px-4 py-2 text-left text-sm text-error hover:bg-surface-2">
                Cerrar sesion
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
