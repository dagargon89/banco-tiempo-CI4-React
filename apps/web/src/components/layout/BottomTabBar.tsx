import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { cuenta, estaActivo, pendiente, principal } from './navConfig';
import { useNavCounts } from './useNavCounts';

/** Barra inferior en móvil: las mismas secciones del menú, sin modos. */
export default function BottomTabBar() {
  const { pathname } = useLocation();
  const verificado = useAuthStore((s) => s.user?.estado_verificacion === 'verificado');
  const counts = useNavCounts();

  if (pathname.startsWith('/admin')) return null;

  const tabs = verificado ? [...principal, cuenta[0]] : pendiente;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Secciones"
    >
      {tabs.map((item) => {
        const activo = estaActivo(item, pathname);
        const Icon = item.icon;
        const n = counts[item.to] ?? 0;
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={activo ? 'page' : undefined}
            className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[11px] transition-colors ${activo ? 'text-text-1' : 'text-text-2'}`}
          >
            <span className={`flex h-7 w-12 items-center justify-center rounded-full ${activo ? 'bg-surface shadow-sm ring-1 ring-border' : ''}`}>
              <Icon className={`h-5 w-5 ${activo ? 'text-accent' : ''}`} aria-hidden />
            </span>
            {item.label === 'Mi perfil' ? 'Perfil' : item.label}
            {n > 0 && (
              <span className="absolute right-[calc(50%-1.6rem)] top-1 min-w-5 rounded-full bg-accent px-1.5 text-center text-[10px] font-semibold leading-5 text-on-accent">
                {n}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
