import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({
  title = 'Nothing here yet',
  hint,
  icon,
}: {
  title?: string;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-faint">
        {icon ?? <Inbox size={22} />}
      </div>
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint ? <p className="max-w-sm text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
