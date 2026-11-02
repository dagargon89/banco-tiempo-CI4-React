import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import ThemeToggle from '@/components/ui/ThemeToggle';
import NavList from './NavList';
import { esAdmin, gruposDeNavegacion, inicioAdmin } from './navConfig';
import { useNavCounts } from './useNavCounts';

export default function Sidebar() {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? [];
  const verificado = user?.estado_verificacion === 'verificado';
  const enAdmin = pathname.startsWith('/admin');
  const grupos = gruposDeNavegacion(pathname, roles, verificado);
  const counts = useNavCounts();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-bg px-4 py-5" aria-label="Navegación principal">
      <Link to="/inicio" className="flex items-center gap-2.5 px-2">
        <img src="/logo.png" alt="Participa Juárez" className="brand-logo h-8 w-auto shrink-0" />
        <span className="font-display text-[15px] font-semibold text-text-1">Banco de Tiempo</span>
      </Link>

      <nav className="mt-8 flex-1 overflow-y-auto" aria-label={enAdmin ? 'Administración' : 'Secciones'}>
        <NavList grupos={grupos} counts={enAdmin ? {} : counts} />
      </nav>

      <div className="space-y-3 border-t border-border pt-4">
        {enAdmin ? (
          <Link to={verificado ? '/inicio' : '/perfil'} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-text-2 hover:bg-surface/70 hover:text-text-1">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Volver al Banco de Tiempo
          </Link>
        ) : (
          esAdmin(roles) && (
            <Link to={inicioAdmin(roles)} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-text-2 hover:bg-surface/70 hover:text-text-1">
              <Shield className="h-4 w-4" aria-hidden /> Administración
            </Link>
          )
        )}
        <div className="flex items-center justify-between px-3">
          <Link to="/privacidad" className="text-xs text-text-2 hover:text-text-1">Aviso de privacidad</Link>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
