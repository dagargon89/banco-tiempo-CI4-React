import { Link, useLocation } from 'react-router-dom';
import { estaActivo, type NavGroup } from './navConfig';

interface Props {
  grupos: NavGroup[];
  counts?: Record<string, number>;
  onNavigate?: () => void;
}

/** Lista de navegación compartida por el menú lateral y el cajón móvil. */
export default function NavList({ grupos, counts = {}, onNavigate }: Props) {
  const { pathname } = useLocation();

  return (
    <div className="space-y-6">
      {grupos.map((grupo, gi) => (
        <div key={grupo.label ?? gi}>
          {grupo.label && <p className="mb-2 px-3 text-sm text-text-2">{grupo.label}</p>}
          <ul className="space-y-1">
            {grupo.items.map((item) => {
              const activo = estaActivo(item, pathname);
              const Icon = item.icon;
              const n = counts[item.to] ?? 0;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    aria-current={activo ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-full px-3 py-2 text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      activo
                        ? 'bg-surface font-medium text-text-1 shadow-sm ring-1 ring-border'
                        : 'text-text-2 hover:bg-surface/70 hover:text-text-1'
                    }`}
                  >
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${activo ? 'text-accent' : ''}`} aria-hidden />
                    <span className="flex-1">{item.label}</span>
                    {n > 0 && (
                      <span className="min-w-6 rounded-full bg-accent px-2 py-0.5 text-center text-xs font-semibold text-on-accent">
                        {n}
                        <span className="sr-only"> por responder</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
