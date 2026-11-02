import type { ReactNode } from 'react';

/**
 * Panel grande de esquinas suaves con un halo de color en el borde interior.
 * El halo mezcla los tonos de la marca y queda detrás del contenido.
 */
export default function GlowCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[28px] border border-border bg-surface-2 ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 rounded-[22px] opacity-80 blur-2xl sm:inset-6"
        style={{
          background:
            'conic-gradient(from 210deg, var(--accent-2), var(--lime), var(--accent), var(--cat-tecnologia-ink), var(--accent-2))',
        }}
      />
      <div className="relative m-3 flex min-h-[280px] min-w-0 items-center justify-center rounded-[22px] bg-surface/95 p-3 sm:m-8 sm:min-h-[360px] sm:p-8 [&>*]:min-w-0">
        {children}
      </div>
    </div>
  );
}
