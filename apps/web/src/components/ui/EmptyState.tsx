import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-border bg-surface p-8 text-center">
      {icon && <div className="mb-3 text-text-3">{icon}</div>}
      <p className="text-sm font-medium text-text-2">{title}</p>
      {subtitle && <p className="mt-1 text-xs text-text-3">{subtitle}</p>}
    </div>
  );
}
