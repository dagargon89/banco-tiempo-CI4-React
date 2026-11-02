import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Plus, LogOut, User, LifeBuoy, MessageCircle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import ConversationsPopover from '@/features/chat/components/ConversationsPopover';

interface TopBarProps {
  onMenuToggle?: () => void;
}

const iconButton =
  'relative flex h-10 w-10 items-center justify-center rounded-full text-text-2 transition-colors hover:bg-surface hover:text-text-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const verificado = user?.estado_verificacion === 'verificado';
  const enAdmin = pathname.startsWith('/admin');
  // Explorar ya tiene su propio buscador grande: no duplicarlo arriba.
  const mostrarBusqueda = verificado && !enAdmin && pathname !== '/inicio';

  const [busqueda, setBusqueda] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mensajesOpen, setMensajesOpen] = useState(false);
  const mensajesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false);
      if (mensajesRef.current && !mensajesRef.current.contains(target)) setMensajesOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setMensajesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Cerrar menús al navegar (ajuste de estado durante el render, sin efecto).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
    setMensajesOpen(false);
  }

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    const q = busqueda.trim();
    navigate(q ? `/inicio?q=${encodeURIComponent(q)}` : '/inicio');
    setBusqueda('');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-bg/85 px-4 backdrop-blur-md sm:px-6">
      {onMenuToggle && (
        <button onClick={onMenuToggle} className={`${iconButton} -ml-2 lg:hidden`} aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </button>
      )}
      <Link to="/inicio" className="flex items-center gap-2 lg:hidden" aria-label="Banco de Tiempo, ir a explorar">
        <img src="/logo.png" alt="" className="brand-logo h-8 w-auto" />
        <span className="hidden font-display text-sm font-semibold text-text-1 min-[400px]:inline">Banco de Tiempo</span>
      </Link>


      {mostrarBusqueda && (
        <form onSubmit={buscar} role="search" className="ml-auto hidden w-full max-w-sm md:block">
          <label htmlFor="busqueda-global" className="sr-only">Buscar ofertas</label>
          <div className="flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
            <Search className="h-4 w-4 shrink-0 text-text-3" aria-hidden />
            <input
              id="busqueda-global"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="¿Qué quieres aprender?"
              className="min-w-0 flex-1 bg-transparent text-sm text-text-1 placeholder:text-text-2 focus:outline-none"
            />
          </div>
        </form>
      )}

      <div className={`flex items-center gap-1 sm:gap-2 ${mostrarBusqueda ? 'md:ml-2' : ''} ml-auto`}>
        {verificado && !enAdmin && pathname !== '/ensenando' && pathname !== '/ofertas/nueva' && (
          <Link
            to="/ofertas/nueva"
            className="hidden h-10 items-center gap-1.5 rounded-full bg-text-1 px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:inline-flex"
          >
            <Plus className="h-4 w-4" aria-hidden /> Nueva oferta
          </Link>
        )}

        {verificado && (
          <div className="relative" ref={mensajesRef}>
            <button
              onClick={() => setMensajesOpen((v) => !v)}
              className={iconButton}
              aria-label="Conversaciones"
              aria-expanded={mensajesOpen}
              aria-haspopup="true"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
            <ConversationsPopover open={mensajesOpen} onClose={() => setMensajesOpen(false)} />
          </div>
        )}

        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center rounded-full p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="Menú de tu cuenta"
            >
              <Avatar src={user.foto_perfil} nombre={user.nombre} size="sm" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-lg"
                role="menu"
                aria-label="Tu cuenta"
              >
                <div className="px-3 py-2.5">
                  <p className="truncate font-medium text-text-1">{user.nombre}</p>
                  <p className="truncate text-sm text-text-2">{user.email}</p>
                </div>
                <div className="my-1 border-t border-border" />
                <Link to="/perfil" role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-1 hover:bg-surface-2">
                  <User className="h-4 w-4 text-text-2" aria-hidden /> Mi perfil
                </Link>
                {verificado && (
                  <Link to="/mis-tickets" role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-1 hover:bg-surface-2">
                    <LifeBuoy className="h-4 w-4 text-text-2" aria-hidden /> Soporte
                  </Link>
                )}
                <button
                  onClick={logout}
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-error hover:bg-surface-2"
                >
                  <LogOut className="h-4 w-4" aria-hidden /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
