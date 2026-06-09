interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect';
}

export default function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const base = 'animate-pulse bg-surface-2';
  const shape = variant === 'circle' ? 'rounded-full' : variant === 'text' ? 'rounded' : 'rounded-lg';
  return <div className={`${base} ${shape} ${className}`} />;
}

export function OfertaCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <Skeleton className="h-24 rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
          <Skeleton variant="circle" className="h-8 w-8" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function VinculacionCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Skeleton variant="circle" className="h-8 w-8" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-2 flex items-center gap-2">
        <Skeleton variant="circle" className="h-4 w-4" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-7 w-16" />
    </div>
  );
}
