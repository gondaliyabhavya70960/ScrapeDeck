import { ArrowRight, ExternalLink } from 'lucide-react';
import { Thumbnail } from './ui/Thumbnail';
import { SourceBadge } from './ui/SourceBadge';
import { DeltaBadge } from './ui/DeltaBadge';
import { AvailabilityPill } from './ui/AvailabilityPill';
import { formatPrice, formatRelative } from '@/lib/format';
import type { ChangeEvent } from '@/lib/types';

export function ChangeRow({ change: c }: { change: ChangeEvent }) {
  const priceChange = c.oldPrice != null || c.newPrice != null;
  const availChange = c.oldAvailability != null || c.newAvailability != null;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <Thumbnail src={c.imageUrl} alt={c.title} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-medium text-ink" title={c.title}>
            {c.title}
          </p>
          {c.url ? (
            <a
              href={c.url}
              target="_blank"
              rel="noreferrer"
              aria-label="Open product"
              className="text-faint hover:text-accent"
            >
              <ExternalLink size={12} />
            </a>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <SourceBadge source={c.source} />
          <span className="text-2xs text-faint">{formatRelative(c.timestamp)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 text-xs">
        {priceChange ? (
          <>
            <span className="font-mono tabular text-faint line-through">
              {formatPrice(c.oldPrice, c.currency)}
            </span>
            <ArrowRight size={12} className="text-faint" />
            <span className="font-mono tabular font-medium text-ink">
              {formatPrice(c.newPrice, c.currency)}
            </span>
            {c.direction && c.pct != null ? (
              <DeltaBadge direction={c.direction} pct={c.pct} />
            ) : null}
          </>
        ) : availChange ? (
          <div className="flex items-center gap-1.5">
            <AvailabilityPill value={c.oldAvailability} />
            <ArrowRight size={12} className="text-faint" />
            <AvailabilityPill value={c.newAvailability} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
