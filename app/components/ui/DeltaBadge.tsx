import { cn, formatPct } from '@/lib/format';

export function DeltaBadge({
  direction,
  pct,
  size = 'sm',
}: {
  direction: 'up' | 'down';
  pct: number;
  size?: 'sm' | 'xs';
}) {
  const up = direction === 'up';
  return (
    <span
      className={cn(
        'tabular inline-flex items-center gap-0.5 rounded-pill font-medium',
        size === 'xs' ? 'px-1 text-2xs' : 'px-1.5 py-0.5 text-2xs',
        up
          ? 'bg-[color:var(--up)]/10 text-up'
          : 'bg-[color:var(--down)]/10 text-down',
      )}
      title={`${up ? 'Increased' : 'Decreased'} ${formatPct(Math.abs(pct))}`}
    >
      <span aria-hidden>{up ? '▲' : '▼'}</span>
      {formatPct(Math.abs(pct))}
    </span>
  );
}
