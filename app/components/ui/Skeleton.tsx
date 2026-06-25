import { cn } from '@/lib/format';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-control', className)} />;
}

/** A table-shaped skeleton for loading states. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border bg-surface-2 px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-10 w-10 rounded-control" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-8 w-24" />
          <Skeleton className="mt-3 h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
