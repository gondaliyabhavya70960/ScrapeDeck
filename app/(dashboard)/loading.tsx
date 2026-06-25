import { Skeleton, CardGridSkeleton, TableSkeleton } from '@/app/components/ui/Skeleton';

export default function Loading() {
  return (
    <>
      <div className="mb-6">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <CardGridSkeleton />
      <div className="mt-6">
        <TableSkeleton />
      </div>
    </>
  );
}
