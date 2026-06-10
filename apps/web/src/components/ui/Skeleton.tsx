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
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="ml-auto h-5 w-16 rounded-full" />
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="mt-auto flex items-center gap-2 border-t border-border pt-2">
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

export function ProfileHeaderSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="h-32 bg-surface-2" />
      <div className="relative px-6 pb-6">
        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Skeleton variant="circle" className="h-24 w-24 border-4 border-surface" />
            <div className="mb-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TicketCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-2 flex items-center gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mb-1.5 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <div className="flex gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function DetalleSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
        <Skeleton variant="circle" className="h-12 w-12" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}
