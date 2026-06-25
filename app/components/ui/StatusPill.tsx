import { cn } from '@/lib/format';
import type { RunStatus } from '@/lib/types';

const MAP: Record<RunStatus, { label: string; dot: string; cls: string }> = {
  ok: {
    label: 'OK',
    dot: 'bg-ok',
    cls: 'border-[color:var(--ok)]/20 bg-[color:var(--ok)]/10 text-ok',
  },
  partial: {
    label: 'Partial',
    dot: 'bg-warn',
    cls: 'border-[color:var(--warn)]/20 bg-[color:var(--warn)]/10 text-warn',
  },
  failed: {
    label: 'Failed',
    dot: 'bg-up',
    cls: 'border-[color:var(--up)]/20 bg-[color:var(--up)]/10 text-up',
  },
};

export function StatusPill({ status }: { status: RunStatus }) {
  const s = MAP[status] ?? MAP.ok;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-2xs font-medium',
        s.cls,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </span>
  );
}
