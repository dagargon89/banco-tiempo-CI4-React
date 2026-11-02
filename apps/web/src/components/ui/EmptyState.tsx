import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  /** Un estado vacío es una invitación: dile a la persona qué hacer. */
  action?: { label: string; to: string };
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface p-8 text-center">
      {icon && <div className="mb-3 text-text-3" aria-hidden>{icon}</div>}
      <p className="font-medium text-text-1">{title}</p>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-text-2">{subtitle}</p>}
      {action && (
        <Link
          to={action.to}
          className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
