import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Package, PlusCircle, MessageSquare, User } from 'lucide-react';

const tabs = [
  { to: '/inicio', label: 'Explorar', icon: Compass, end: true },
  { to: '/mis-ofertas', label: 'Ofertas', icon: Package },
  { to: '/ofertas/nueva', label: 'Crear', icon: PlusCircle },
  { to: '/mensajes', label: 'Mensajes', icon: MessageSquare },
  { to: '/perfil', label: 'Perfil', icon: User },
];

export default function BottomTabBar() {
  const { pathname } = useLocation();
  // Hide on admin routes
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-surface lg:hidden"
      aria-label="Navegacion principal"
    >
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              isActive ? 'text-accent' : 'text-text-3'
            }`
          }
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
