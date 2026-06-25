import { cn, formatPrice } from '@/lib/format';
import { DeltaBadge } from './DeltaBadge';
import type { PriceDelta } from '@/lib/types';

export function PriceCell({
  price,
  currency,
  delta,
  className,
  showDelta = true,
}: {
  price: number | null;
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
        {formatPrice(price, currency)}
      </span>
    </div>
  );
}
