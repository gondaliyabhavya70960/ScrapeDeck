import { cn, formatPriceRange } from '@/lib/format';
import { DeltaBadge } from './DeltaBadge';
import type { PriceDelta } from '@/lib/types';

export function PriceCell({
  price,
  max,
  currency,
  delta,
  className,
  showDelta = true,
}: {
  price: number | null;
  /** Upper bound of the price range; renders "min–max" when it exceeds price. */
  max?: number | null;
  currency: string;
  delta?: PriceDelta | null;
  className?: string;
  showDelta?: boolean;
}) {
  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>
      {showDelta && delta ? (
        <DeltaBadge direction={delta.direction} pct={delta.pct} />
      ) : null}
      <span className="font-mono text-sm font-medium tabular text-ink">
        {formatPriceRange(price, max, currency)}
      </span>
    </div>
  );
}
