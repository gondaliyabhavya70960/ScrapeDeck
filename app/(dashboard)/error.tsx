'use client';

import { RotateCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card card-raised flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-sm font-medium text-ink">Something went wrong</p>
      <p className="max-w-md text-xs text-muted">
        {error.message || 'An unexpected error occurred while rendering this view.'}
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-1.5 rounded-control bg-accent px-3 py-2 text-xs font-medium text-white hover:opacity-90"
      >
        <RotateCw size={14} />
        Try again
      </button>
    </div>
  );
}
