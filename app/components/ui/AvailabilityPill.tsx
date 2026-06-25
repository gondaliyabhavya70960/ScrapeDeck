import { cn } from '@/lib/format';
import { availabilityLabel } from '@/lib/format';

export function AvailabilityPill({ value }: { value: string | null }) {
  const inStock = value === 'in_stock';
  const outStock = value === 'out_of_stock';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-2xs font-medium',
        inStock && 'border-[color:var(--ok)]/20 bg-[color:var(--ok)]/10 text-ok',
        outStock &&
          'border-[color:var(--up)]/20 bg-[color:var(--up)]/10 text-up',
        !inStock && !outStock && 'border-border bg-surface-2 text-faint',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          inStock && 'bg-ok',
          outStock && 'bg-up',
          !inStock && !outStock && 'bg-faint',
        )}
        aria-hidden
      />
      {availabilityLabel(value)}
    </span>
  );
}
