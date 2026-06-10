import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import {
  Compass, LayoutDashboard, ArrowLeftRight,
  MessageSquare, ShieldCheck, Package,
  Users, Ticket, BarChart3, FolderOpen, LifeBuoy, UserCog,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import ThemeToggle from '@/components/ui/ThemeToggle';

type NavItem = { to: string; label: string; icon: React.ElementType; end?: boolean };

const buscadorNav: NavItem[] = [
  { to: '/inicio', label: 'Explorar', icon: Compass, end: true },
  { to: '/vinculaciones', label: 'Vinculaciones', icon: ArrowLeftRight },
  { to: '/mensajes', label: 'Mensajes', icon: MessageSquare },
  { to: '/mis-tickets', label: 'Soporte', icon: LifeBuoy },
];

const oferenteNav: NavItem[] = [
  { to: '/mis-ofertas', label: 'Panel', icon: LayoutDashboard },
  { to: '/vinculaciones', label: 'Vinculaciones', icon: ArrowLeftRight },
  { to: '/mensajes', label: 'Mensajes', icon: MessageSquare },
];

const adminNavBase: NavItem[] = [
  { to: '/admin/verificaciones', label: 'Verificaciones', icon: ShieldCheck },
  { to: '/admin/ofertas', label: 'Ofertas', icon: Package },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { to: '/admin/metricas', label: 'Metricas', icon: BarChart3 },
];

const superAdminItems: NavItem[] = [
  { to: '/admin/categorias', label: 'Categorias', icon: FolderOpen },
  { to: '/admin/moderadores', label: 'Moderadores', icon: UserCog },
];

const linkBase = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150';
const linkActive = 'bg-accent/10 text-accent';
const linkInactive = 'text-text-2 hover:bg-surface-2 hover:text-text-1';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.roles.includes('super_admin') ?? false;
  const isAdmin = user?.roles.includes('moderador') || isSuperAdmin;

  // Close on route change
  useEffect(() => { onClose(); }, [pathname, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const sections = [
    { label: 'BUSCADOR', items: buscadorNav },
    { label: 'OFERENTE', items: oferenteNav },
    ...(isAdmin ? [{ label: 'ADMINISTRADOR', items: isSuperAdmin ? [...adminNavBase, ...superAdminItems] : adminNavBase }] : []),
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-surface shadow-lg transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Navegacion movil"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent">
              <span className="text-sm font-bold text-white">BT</span>
            </div>
            <div>
              <p className="text-sm font-bold text-text-1">Banco de Tiempo</p>
              <p className="text-[10px] text-text-3">Plan Juarez</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 hover:text-text-1" aria-label="Cerrar menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map(({ label, items }) => (
            <div key={label} className="mb-4">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-text-3">{label}</p>
              <div className="flex flex-col gap-0.5">
                {items.map(({ to, label: itemLabel, icon: Icon, end }) => (
                  <NavLink
                    key={`${label}-${to}`}
                    to={to}
                    end={end}
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                    {itemLabel}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <NavLink to="/privacidad" className="text-[11px] text-text-3 hover:text-text-2 transition-colors">
            Aviso de Privacidad
          </NavLink>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
