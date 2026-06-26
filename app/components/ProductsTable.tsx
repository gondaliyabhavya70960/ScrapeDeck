'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ExternalLink,
  SlidersHorizontal,
  Clock3,
} from 'lucide-react';
import { Thumbnail } from './ui/Thumbnail';
import { SourceBadge } from './ui/SourceBadge';
import { AvailabilityPill } from './ui/AvailabilityPill';
import { PriceCell } from './ui/PriceCell';
import { EmptyState } from './ui/EmptyState';
import { ProductDrawer } from './ProductDrawer';
import { DownloadButton } from './DownloadButton';
import type { PricePoint } from './PriceHistoryChart';
import { cn, formatRelative, verticalLabel } from '@/lib/format';
import type { Product } from '@/lib/types';

type SortKey = 'title' | 'price' | 'lastChanged';
type SortDir = 'asc' | 'desc';
const PAGE_SIZE = 25;
const DAY_MS = 86_400_000;

export function ProductsTable({
  products,
  historyByKey,
  sources,
  categories,
  vertical,
}: {
  products: Product[];
  historyByKey: Record<string, PricePoint[]>;
  sources: string[];
  categories: string[];
  vertical: string;
}) {
  const [q, setQ] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [category, setCategory] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [changed24h, setChanged24h] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: 'lastChanged',
    dir: 'desc',
  });
  const [page, setPage] = useState(0);
  const [active, setActive] = useState<Product | null>(null);

  // Any filter change resets to the first page.
  useEffect(() => {
    setPage(0);
  }, [q, selectedSources, category, availability, changed24h, sort]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const srcSet = new Set(selectedSources);
    const now = Date.now();
    const rows = products.filter((p) => {
      if (needle) {
        const hay = `${p.title} ${p.shortTagline} ${p.category}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (srcSet.size && !srcSet.has(p.source)) return false;
      if (category !== 'all' && p.category !== category) return false;
      if (availability !== 'all' && p.status !== availability) return false;
      if (changed24h) {
        const t = Date.parse(p.lastChanged);
        if (Number.isNaN(t) || now - t > DAY_MS) return false;
      }
      return true;
    });

    const dir = sort.dir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      if (sort.key === 'title') return a.title.localeCompare(b.title) * dir;
      if (sort.key === 'price') {
        const av = a.priceMin ?? Number.POSITIVE_INFINITY;
        const bv = b.priceMin ?? Number.POSITIVE_INFINITY;
        return (av - bv) * dir;
      }
      return a.lastChanged.localeCompare(b.lastChanged) * dir;
    });
    return rows;
  }, [products, q, selectedSources, category, availability, changed24h, sort]);

  // Export reflects the *current* filters so the download matches the view.
  const exportQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (vertical && vertical !== 'all') p.set('v', vertical);
    if (q.trim()) p.set('q', q.trim());
    if (selectedSources.length) p.set('source', selectedSources.join(','));
    if (category !== 'all') p.set('category', category);
    if (availability !== 'all') p.set('availability', availability);
    if (changed24h) p.set('changed', '1');
    return p.toString();
  }, [vertical, q, selectedSources, category, availability, changed24h]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'title' ? 'asc' : 'desc' },
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, tagline, category…"
            aria-label="Search products"
            className="h-9 w-full rounded-control border border-border bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-faint focus:border-accent"
          />
        </div>

        <SourceMultiSelect
          sources={sources}
          selected={selectedSources}
          onChange={setSelectedSources}
        />

        <select
          aria-label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 max-w-[180px] rounded-control border border-border bg-surface px-2.5 text-xs text-ink focus:border-accent"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          aria-label="Availability"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="h-9 rounded-control border border-border bg-surface px-2.5 text-xs text-ink focus:border-accent"
        >
          <option value="all">Any stock</option>
          <option value="active">In stock</option>
          <option value="out_of_stock">Out of stock</option>
        </select>

        <button
          onClick={() => setChanged24h((v) => !v)}
          aria-pressed={changed24h}
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-control border px-3 text-xs font-medium transition-colors',
            changed24h
              ? 'border-accent bg-accent/10 text-accent-ink'
              : 'border-border bg-surface text-muted hover:text-ink',
          )}
        >
          <Clock3 size={14} />
          Changed 24h
        </button>

        <div className="ml-auto">
          <DownloadButton query={exportQuery} />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="sticky top-0 z-10 bg-surface-2 text-muted">
              <tr className="border-b border-border">
                <th className="w-12 px-4 py-2.5" />
                <SortHeader
                  label="Product"
                  active={sort.key === 'title'}
                  dir={sort.dir}
                  onClick={() => toggleSort('title')}
                  className="text-left"
                />
                <SortHeader
                  label="Price"
                  active={sort.key === 'price'}
                  dir={sort.dir}
                  onClick={() => toggleSort('price')}
                  className="text-right"
                />
                <th className="px-4 py-2.5 text-left text-2xs font-medium uppercase tracking-wide">
                  Stock
                </th>
                <SortHeader
                  label="Changed"
                  active={sort.key === 'lastChanged'}
                  dir={sort.dir}
                  onClick={() => toggleSort('lastChanged')}
                  className="text-right"
                />
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((p) => (
                <tr
                  key={p.key}
                  tabIndex={0}
                  onClick={() => setActive(p)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setActive(p);
                  }}
                  className="cursor-pointer transition-colors hover:bg-surface-2 focus:bg-surface-2 focus:outline-none"
                >
                  <td className="py-2.5 pl-4 pr-0">
                    <Thumbnail src={p.images[0]} alt={p.title} size={40} />
                  </td>
                  <td className="px-4 py-2.5">
                    <p
                      className="line-clamp-1 font-medium text-ink"
                      title={p.title}
                    >
                      {p.title}
                    </p>
                    {p.shortTagline ? (
                      <p
                        className="mt-0.5 line-clamp-1 text-2xs text-muted"
                        title={p.shortTagline}
                      >
                        {p.shortTagline}
                      </p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <SourceBadge source={p.source} />
                      <span className="rounded-pill bg-surface-2 px-1.5 py-0.5 text-2xs text-muted">
                        {verticalLabel(p.vertical)}
                      </span>
                      {p.category ? (
                        <span className="max-w-[140px] truncate rounded-pill bg-surface-2 px-1.5 py-0.5 text-2xs text-faint">
                          {p.category}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <PriceCell
                      price={p.priceMin}
                      max={p.priceMax}
                      currency={p.currency}
                      delta={p.delta}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <AvailabilityPill value={p.status} />
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted">
                    {formatRelative(p.lastChanged)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Open ${p.title} on store`}
                      className="inline-flex text-faint hover:text-accent"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No products match these filters"
            hint="Try clearing the search or widening the source / availability filters."
          />
        ) : null}

        {/* Pagination */}
        {filtered.length > 0 ? (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted">
            <span className="tabular">
              {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of{' '}
              {filtered.length.toLocaleString('en-IN')}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={clampedPage === 0}
                className="rounded-control border border-border px-2.5 py-1 enabled:hover:bg-surface-2 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-2 tabular">
                {clampedPage + 1} / {pageCount}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={clampedPage >= pageCount - 1}
                className="rounded-control border border-border px-2.5 py-1 enabled:hover:bg-surface-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <ProductDrawer
        product={active}
        history={active ? (historyByKey[active.key] ?? []) : []}
        onClose={() => setActive(null)}
      />
    </>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  className?: string;
}) {
  return (
    <th
      className={cn('px-4 py-2.5', className)}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1 text-2xs font-medium uppercase tracking-wide transition-colors hover:text-ink',
          className?.includes('text-right') && 'flex-row-reverse',
          active ? 'text-ink' : 'text-muted',
        )}
      >
        {label}
        {active ? (
          dir === 'asc' ? (
            <ArrowUp size={12} />
          ) : (
            <ArrowDown size={12} />
          )
        ) : (
          <ArrowUpDown size={12} className="text-faint" />
        )}
      </button>
    </th>
  );
}

function SourceMultiSelect({
  sources,
  selected,
  onChange,
}: {
  sources: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(s: string) {
    onChange(
      selected.includes(s)
        ? selected.filter((x) => x !== s)
        : [...selected, s],
    );
  }
  return (
    <details className="group relative">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-control border border-border bg-surface px-3 text-xs font-medium text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal size={14} />
        Sources
        {selected.length ? (
          <span className="tabular rounded-pill bg-accent/15 px-1.5 text-2xs text-accent-ink">
            {selected.length}
          </span>
        ) : null}
        <ChevronDown size={13} className="text-faint" />
      </summary>
      <div className="absolute left-0 z-20 mt-1.5 max-h-64 w-52 overflow-auto rounded-control border border-border bg-surface p-1 shadow-raised animate-fade-in">
        {selected.length ? (
          <button
            onClick={() => onChange([])}
            className="mb-1 w-full rounded-[6px] px-2 py-1 text-left text-2xs text-accent hover:bg-surface-2"
          >
            Clear selection
          </button>
        ) : null}
        {sources.map((s) => (
          <label
            key={s}
            className="flex cursor-pointer items-center gap-2 rounded-[6px] px-2 py-1.5 text-xs text-ink hover:bg-surface-2"
          >
            <input
              type="checkbox"
              checked={selected.includes(s)}
              onChange={() => toggle(s)}
              className="accent-[color:var(--accent)]"
            />
            <SourceBadge source={s} />
          </label>
        ))}
      </div>
    </details>
  );
}
