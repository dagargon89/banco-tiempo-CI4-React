import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Shield, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import ThemeToggle from '@/components/ui/ThemeToggle';
import NavList from './NavList';
import { esAdmin, gruposDeNavegacion, inicioAdmin } from './navConfig';
import { useNavCounts } from './useNavCounts';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** El mismo menú que el lateral de escritorio, en un cajón. */
export default function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? [];
  const verificado = user?.estado_verificacion === 'verificado';
  const enAdmin = pathname.startsWith('/admin');
  const grupos = gruposDeNavegacion(pathname, roles, verificado);
  const counts = useNavCounts();
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) cerrarRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-night/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[min(20rem,85vw)] flex-col bg-bg px-4 py-5 shadow-lg transition-transform duration-200 lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Menú"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="flex items-center justify-between px-2">
          <Link to="/inicio" onClick={onClose} className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Participa Juárez" className="brand-logo h-8 w-auto shrink-0" />
            <span className="font-display text-[15px] font-semibold text-text-1">Banco de Tiempo</span>
          </Link>
          <button
            ref={cerrarRef}
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-2 hover:bg-surface hover:text-text-1"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 flex-1 overflow-y-auto" aria-label="Secciones">
          <NavList grupos={grupos} counts={enAdmin ? {} : counts} onNavigate={onClose} />
        </nav>

        <div className="space-y-3 border-t border-border pt-4">
          {enAdmin ? (
            <Link to={verificado ? '/inicio' : '/perfil'} onClick={onClose} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-text-2 hover:text-text-1">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Volver al Banco de Tiempo
            </Link>
          ) : (
            esAdmin(roles) && (
              <Link to={inicioAdmin(roles)} onClick={onClose} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-text-2 hover:text-text-1">
                <Shield className="h-4 w-4" aria-hidden /> Administración
              </Link>
            )
          )}
          <div className="flex items-center justify-between px-3">
            <Link to="/privacidad" onClick={onClose} className="text-xs text-text-2 hover:text-text-1">Aviso de privacidad</Link>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
