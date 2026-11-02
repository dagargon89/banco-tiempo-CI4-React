import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: ReactNode;
  /** Acciones a la derecha (en móvil, debajo del título). */
  actions?: ReactNode;
  /** Algo pequeño encima del título, como un enlace para volver. */
  eyebrow?: ReactNode;
}

/**
 * Encabezado común de las páginas del panel: el mismo titular amplio y
 * ligero de la landing, a menor escala.
 */
export default function PageHeader({ title, subtitle, actions, eyebrow }: Props) {
  return (
    <header className="mb-8 flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-3">{eyebrow}</div>}
        <h1 className="font-display text-[34px] font-medium leading-[1.05] tracking-[-0.02em] text-text-1 sm:text-[44px]">
          {title}
        </h1>
        {subtitle && <p className="mt-3 max-w-2xl text-text-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** Título de sección dentro de una página, con una cifra opcional. */
export function SectionTitle({ children, count, aside }: { children: ReactNode; count?: number; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-xl font-medium text-text-1 sm:text-2xl">
        {children}
        {count !== undefined && count > 0 && <span className="ml-2 text-text-2">{count}</span>}
      </h2>
      {aside}
    </div>
  );
}
