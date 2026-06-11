import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Package, PlusCircle, MessageSquare, User, BadgeCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const verifiedTabs = [
  { to: '/inicio', label: 'Explorar', icon: Compass, end: true },
  { to: '/mis-ofertas', label: 'Ofertas', icon: Package },
  { to: '/ofertas/nueva', label: 'Crear', icon: PlusCircle },
  { to: '/mensajes', label: 'Mensajes', icon: MessageSquare },
  { to: '/perfil', label: 'Perfil', icon: User },
];

const pendingTabs = [
  { to: '/perfil', label: 'Perfil', icon: User, end: true },
  { to: '/verificacion', label: 'Verificar', icon: BadgeCheck },
];

export default function BottomTabBar() {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const isVerified = user?.estado_verificacion === 'verificado';

  // Hide on admin routes
  if (pathname.startsWith('/admin')) return null;

  const tabs = isVerified ? verifiedTabs : pendingTabs;

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
