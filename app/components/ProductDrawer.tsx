'use client';

import { useEffect } from 'react';
import { X, ExternalLink, Tag, Boxes, Clock, Calendar } from 'lucide-react';
import { Thumbnail } from './ui/Thumbnail';
import { SourceBadge } from './ui/SourceBadge';
import { DeltaBadge } from './ui/DeltaBadge';
import { AvailabilityPill } from './ui/AvailabilityPill';
import { PriceHistoryChart, type PricePoint } from './PriceHistoryChart';
import {
  formatPrice,
  formatDate,
  formatRelative,
  verticalLabel,
} from '@/lib/format';
import type { Product } from '@/lib/types';

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-2xs uppercase tracking-wide text-faint">
        {icon}
        {label}
      </span>
      <span className="text-xs font-medium text-ink">{value}</span>
    </div>
  );
}

export function ProductDrawer({
  product,
  history,
  onClose,
}: {
  product: Product | null;
  history: PricePoint[];
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (product) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [product, onClose]);

  if (!product) return null;
  const discounted =
    product.originalPrice != null &&
    product.price != null &&
    product.originalPrice > product.price;

  const recent = [...history].reverse().slice(0, 12);

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close details"
        onClick={onClose}
        className="absolute inset-0 bg-ink/30 animate-fade-in"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={product.title}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-surface shadow-drawer animate-slide-in"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-5 py-3 backdrop-blur">
          <span className="text-2xs font-medium uppercase tracking-wide text-muted">
            Product detail
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-control border border-border text-muted hover:bg-surface-2"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex flex-col gap-5 p-5">
          <div className="flex gap-4">
            <Thumbnail
              src={product.imageUrl}
              alt={product.title}
              size={96}
              className="rounded-card"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold leading-snug text-ink">
                {product.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <SourceBadge source={product.source} />
                <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-2xs text-muted">
                  {verticalLabel(product.vertical)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between rounded-card bg-surface-2 px-4 py-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-semibold tabular text-ink">
                  {formatPrice(product.price, product.currency)}
                </span>
                {discounted ? (
                  <span className="font-mono text-sm tabular text-faint line-through">
                    {formatPrice(product.originalPrice, product.currency)}
                  </span>
                ) : null}
              </div>
              {product.delta ? (
                <div className="mt-1.5">
                  <DeltaBadge
                    direction={product.delta.direction}
                    pct={product.delta.pct}
                  />
                  <span className="ml-2 text-2xs text-muted">
                    from {formatPrice(product.delta.previous, product.currency)}
                  </span>
                </div>
              ) : (
                <span className="mt-1.5 block text-2xs text-faint">
                  No price change recorded
                </span>
              )}
            </div>
            <AvailabilityPill value={product.availability} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Meta
              icon={<Tag size={11} />}
              label="SKU"
              value={product.sku || '—'}
            />
            <Meta
              icon={<Boxes size={11} />}
              label="Category"
              value={product.category || '—'}
            />
            <Meta
              icon={<Calendar size={11} />}
              label="First seen"
              value={formatDate(product.firstSeen)}
            />
            <Meta
              icon={<Clock size={11} />}
              label="Last changed"
              value={formatRelative(product.lastChanged)}
            />
          </div>

          <a
            href={product.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-control bg-accent px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            View on store <ExternalLink size={14} />
          </a>

          <div>
            <h3 className="mb-2 text-xs font-semibold text-ink">
              Price history
            </h3>
            <PriceHistoryChart data={history} currency={product.currency} />
          </div>

          {recent.length > 0 ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold text-ink">
                Recent records
              </h3>
              <div className="overflow-hidden rounded-control border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-surface-2 text-muted">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-medium">Date</th>
                      <th className="px-3 py-1.5 text-right font-medium">
                        Price
                      </th>
                      <th className="px-3 py-1.5 text-right font-medium">
                        Stock
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recent.map((h, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5 text-muted">
                          {formatDate(h.t)}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono tabular text-ink">
                          {formatPrice(h.price, product.currency)}
                        </td>
                        <td className="px-3 py-1.5 text-right text-muted">
                          {h.availability === 'in_stock'
                            ? 'In'
                            : h.availability === 'out_of_stock'
                              ? 'Out'
                              : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
