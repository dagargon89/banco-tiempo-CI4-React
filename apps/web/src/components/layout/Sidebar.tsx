import { NavLink, useLocation } from 'react-router-dom';
import {
  Compass, LayoutDashboard, ArrowLeftRight,
  MessageSquare, ShieldCheck, Package,
  Users, Ticket, BarChart3, FolderOpen, LifeBuoy, UserCog,
  User, BadgeCheck,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

type NavItem = { to: string; label: string; icon: React.ElementType; end?: boolean; roles?: string[] };

const pendienteNav: NavItem[] = [
  { to: '/perfil', label: 'Mi perfil', icon: User, end: true },
  { to: '/verificacion', label: 'Subir verificación', icon: BadgeCheck },
];

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

/**
 * Cada item declara qué roles lo pueden ver. super_admin satisface cualquiera
 * (manejado en `filterByRoles`). Refleja la matriz de permisos del backend.
 */
const adminNavAll: NavItem[] = [
  { to: '/admin/verificaciones', label: 'Verificaciones', icon: ShieldCheck, roles: ['moderador', 'verificador'] },
  { to: '/admin/ofertas',        label: 'Ofertas',        icon: Package,     roles: ['moderador'] },
  { to: '/admin/usuarios',       label: 'Usuarios',       icon: Users,       roles: ['moderador'] },
  { to: '/admin/tickets',        label: 'Tickets',        icon: Ticket,      roles: ['moderador', 'soporte'] },
  { to: '/admin/metricas',       label: 'Metricas',       icon: BarChart3,   roles: ['moderador', 'analista'] },
  { to: '/admin/categorias',     label: 'Categorias',     icon: FolderOpen,  roles: ['editor_categorias'] },
  { to: '/admin/moderadores',    label: 'Moderadores',    icon: UserCog,     roles: ['super_admin'] },
];

function filterByRoles(items: NavItem[], userRoles: string[]): NavItem[] {
  const isSuperAdmin = userRoles.includes('super_admin');
  return items.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    if (isSuperAdmin) return true;
    return item.roles.some((r) => userRoles.includes(r));
  });
}

type Context = 'buscador' | 'oferente' | 'admin' | 'pendiente';

function getContext(pathname: string, isVerified: boolean): Context {
  if (pathname.startsWith('/admin')) return 'admin';
  if (!isVerified) return 'pendiente';
  if (
    pathname.startsWith('/mis-ofertas') ||
    pathname === '/ofertas/nueva' ||
    /^\/ofertas\/\d+\/editar$/.test(pathname)
  ) return 'oferente';
  return 'buscador';
}

const contextLabels: Record<Context, string> = {
  buscador: 'BUSCADOR',
  oferente: 'OFERENTE',
  admin: 'ADMINISTRADOR',
  pendiente: 'VERIFICACIÓN PENDIENTE',
};

const linkBase = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40';
const linkActive = 'bg-accent/10 text-accent';
const linkInactive = 'text-text-2 hover:bg-surface-2 hover:text-text-1';

export default function Sidebar() {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const userRoles = user?.roles ?? [];
  const isVerified = user?.estado_verificacion === 'verificado';
  const context = getContext(pathname, isVerified);
  const items = context === 'admin' ? filterByRoles(adminNavAll, userRoles)
    : context === 'pendiente' ? pendienteNav
    : context === 'oferente' ? oferenteNav
    : buscadorNav;

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r border-border bg-surface"
      aria-label="Navegación principal"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <img src="/logo.png" alt="Participa Juárez" className="h-9 w-auto shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-text-1">Banco de Tiempo</p>
          <p className="text-[10px] leading-tight text-text-3">Plan Juárez</p>
        </div>
      </div>

      {/* Section label */}
      <p className="px-5 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-widest text-text-3" aria-hidden="true">
        {contextLabels[context]}
      </p>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label={contextLabels[context]}>
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-5 py-3">
        <NavLink
          to="/privacidad"
          className="text-[11px] text-text-3 hover:text-text-2 transition-colors"
        >
          Aviso de Privacidad
        </NavLink>
      </div>
    </aside>
  );
}
