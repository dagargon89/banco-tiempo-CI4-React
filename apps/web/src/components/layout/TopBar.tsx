import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Plus, Shield, Bell, ChevronRight, LogOut, User } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';

function getContext(pathname: string): 'buscador' | 'oferente' | 'admin' {
  if (pathname.startsWith('/admin')) return 'admin';
  if (
    pathname.startsWith('/mis-ofertas') ||
    pathname === '/ofertas/nueva' ||
    /^\/ofertas\/\d+\/editar$/.test(pathname)
  ) return 'oferente';
  return 'buscador';
}

function getBreadcrumb(pathname: string) {
  if (pathname.startsWith('/admin/verificaciones')) return { section: 'Administración', page: 'Verificaciones' };
  if (pathname.startsWith('/admin/ofertas')) return { section: 'Administración', page: 'Ofertas' };
  if (pathname.startsWith('/admin/usuarios')) return { section: 'Administración', page: 'Usuarios' };
  if (pathname.startsWith('/admin/tickets')) return { section: 'Administración', page: 'Tickets' };
  if (pathname.startsWith('/admin/metricas')) return { section: 'Administración', page: 'Metricas' };
  if (pathname.startsWith('/admin/categorias')) return { section: 'Administración', page: 'Categorias' };
  if (pathname.startsWith('/admin/moderadores')) return { section: 'Administración', page: 'Moderadores' };
  if (pathname === '/tickets/crear') return { section: 'Soporte', page: 'Crear ticket' };
  if (pathname === '/mis-tickets') return { section: 'Soporte', page: 'Mis tickets' };
  if (pathname === '/mis-ofertas') return { section: 'Oferente', page: 'Panel del oferente' };
  if (pathname === '/ofertas/nueva') return { section: 'Oferente', page: 'Publicar habilidad' };
  if (/^\/ofertas\/\d+\/editar$/.test(pathname)) return { section: 'Oferente', page: 'Editar oferta' };
  if (/^\/ofertas\/\d+$/.test(pathname)) return { section: 'Explorar', page: 'Detalle de oferta' };
  if (pathname === '/perfil/editar') return { section: 'Cuenta', page: 'Editar perfil' };
  if (pathname === '/perfil') return { section: 'Cuenta', page: 'Mi perfil' };
  if (pathname === '/verificacion') return { section: 'Cuenta', page: 'Verificación' };
  if (pathname === '/privacidad') return { section: 'Legal', page: 'Aviso de Privacidad' };
  return { section: 'Explorar', page: 'Ofertas disponibles' };
}

export default function TopBar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { pathname } = useLocation();
  const context = getContext(pathname);
  const breadcrumb = getBreadcrumb(pathname);
  const esAdmin = user?.roles.includes('moderador') || user?.roles.includes('super_admin');

  // Accessible dropdown
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      {/* Breadcrumb */}
      <nav aria-label="Ubicación" className="flex items-center gap-1.5 text-sm">
        <span className="text-text-3">{breadcrumb.section}</span>
        <ChevronRight className="h-3.5 w-3.5 text-text-3" aria-hidden="true" />
        <span className="font-medium text-text-1" aria-current="page">{breadcrumb.page}</span>
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Role switcher */}
        <div className="flex items-center rounded-lg border border-border bg-surface-2 p-0.5" role="tablist" aria-label="Modo de navegación">
          <Link
            to="/"
            role="tab"
            aria-selected={context === 'buscador'}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              context === 'buscador' ? 'bg-surface text-text-1 shadow-sm' : 'text-text-3 hover:text-text-2'
            }`}
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            Buscador
          </Link>
          <Link
            to="/mis-ofertas"
            role="tab"
            aria-selected={context === 'oferente'}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              context === 'oferente' ? 'bg-accent text-white shadow-sm' : 'text-text-3 hover:text-text-2'
            }`}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Oferente
          </Link>
          {esAdmin && (
            <Link
              to="/admin/ofertas"
              role="tab"
              aria-selected={context === 'admin'}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                context === 'admin' ? 'bg-surface text-text-1 shadow-sm' : 'text-text-3 hover:text-text-2'
              }`}
            >
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              Admin
            </Link>
          )}
        </div>

        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-text-3 transition-colors duration-150 hover:bg-surface-2 hover:text-text-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Avatar + dropdown */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="Menú de usuario"
            >
              <Avatar src={user.foto_perfil} nombre={user.nombre} size="sm" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg"
                role="menu"
                aria-label="Opciones de usuario"
              >
                <div className="border-b border-border px-4 py-2.5">
                  <p className="truncate text-sm font-medium text-text-1">{user.nombre}</p>
                  <p className="truncate text-xs text-text-3">{user.email}</p>
                </div>
                <Link
                  to="/perfil"
                  role="menuitem"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-2 transition-colors hover:bg-surface-2"
                >
                  <User className="h-4 w-4" aria-hidden="true" /> Mi perfil
                </Link>
                <button
                  onClick={logout}
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-error transition-colors hover:bg-surface-2"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
