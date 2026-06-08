import { NavLink, useLocation } from 'react-router-dom';
import {
  Compass, LayoutDashboard, ArrowLeftRight,
  MessageSquare, ShieldCheck, Package,
} from 'lucide-react';

type NavItem = { to: string; label: string; icon: React.ElementType; end?: boolean };

const buscadorNav: NavItem[] = [
  { to: '/', label: 'Explorar', icon: Compass, end: true },
  { to: '/vinculaciones', label: 'Vinculaciones', icon: ArrowLeftRight },
  { to: '/mensajes', label: 'Mensajes', icon: MessageSquare },
];

const oferenteNav: NavItem[] = [
  { to: '/mis-ofertas', label: 'Panel', icon: LayoutDashboard },
  { to: '/vinculaciones', label: 'Vinculaciones', icon: ArrowLeftRight },
  { to: '/mensajes', label: 'Mensajes', icon: MessageSquare },
];

const adminNav: NavItem[] = [
  { to: '/admin/verificaciones', label: 'Verificaciones', icon: ShieldCheck },
  { to: '/admin/ofertas', label: 'Ofertas', icon: Package },
];

function getContext(pathname: string): 'buscador' | 'oferente' | 'admin' {
  if (pathname.startsWith('/admin')) return 'admin';
  if (
    pathname.startsWith('/mis-ofertas') ||
    pathname === '/ofertas/nueva' ||
    /^\/ofertas\/\d+\/editar$/.test(pathname)
  ) return 'oferente';
  return 'buscador';
}

const contextLabels: Record<string, string> = {
  buscador: 'BUSCADOR',
  oferente: 'OFERENTE',
  admin: 'ADMINISTRADOR',
};

const navMap: Record<string, NavItem[]> = {
  buscador: buscadorNav,
  oferente: oferenteNav,
  admin: adminNav,
};

const linkBase = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40';
const linkActive = 'bg-accent/10 text-accent';
const linkInactive = 'text-text-2 hover:bg-surface-2 hover:text-text-1';

export default function Sidebar() {
  const { pathname } = useLocation();
  const context = getContext(pathname);
  const items = navMap[context];

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r border-border bg-surface"
      aria-label="Navegación principal"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent" aria-hidden="true">
          <span className="text-sm font-bold text-white">BT</span>
        </div>
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
    </aside>
  );
}
