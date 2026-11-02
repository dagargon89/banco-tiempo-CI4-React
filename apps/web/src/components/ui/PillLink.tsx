import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const variantes = {
  // La píldora oscura de la landing: acción principal de la página.
  dark: 'bg-text-1 text-bg hover:opacity-90',
  light: 'border border-border bg-surface text-text-1 hover:border-border-strong',
};

export default function PillLink({
  to,
  children,
  variant = 'dark',
  className = '',
}: {
  to: string;
  children: ReactNode;
  variant?: keyof typeof variantes;
  className?: string;
}) {
  return (
    <Link to={to} className={`${base} ${variantes[variant]} ${className}`}>
      {children}
    </Link>
  );
}
