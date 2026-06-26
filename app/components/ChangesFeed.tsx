'use client';

import { useMemo, useState } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { ChangeRow } from './ChangeRow';
import { SourceBadge } from './ui/SourceBadge';
import { EmptyState } from './ui/EmptyState';
import { cn } from '@/lib/format';
import type { ChangeEvent } from '@/lib/types';

type Kind = 'all' | 'up' | 'down' | 'stock';

const KINDS: { value: Kind; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'down', label: 'Drops' },
  { value: 'up', label: 'Rises' },
  { value: 'stock', label: 'Stock' },
];

function dayLabel(key: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yest = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (key === today) return 'Today';
  if (key === yest) return 'Yesterday';
  return new Date(key + 'T12:00:00Z').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ChangesFeed({
  changes,
  sources,
}: {
  changes: ChangeEvent[];
  sources: string[];
}) {
  const [kind, setKind] = useState<Kind>('all');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const groups = useMemo(() => {
    const srcSet = new Set(selectedSources);
    const filtered = changes.filter((c) => {
      if (srcSet.size && !srcSet.has(c.source)) return false;
      if (kind === 'up') return c.direction === 'up';
      if (kind === 'down') return c.direction === 'down';
      if (kind === 'stock') return c.newStatus != null;
      return true;
    });
    const byDay = new Map<string, ChangeEvent[]>();
    for (const c of filtered) {
      const key = c.timestamp.slice(0, 10);
      const arr = byDay.get(key);
      if (arr) arr.push(c);
      else byDay.set(key, [c]);
    }
    return [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [changes, kind, selectedSources]);

  function toggleSource(s: string) {
    setSelectedSources((cur) =>
      cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-control bg-surface-2 p-0.5">
          {KINDS.map((k) => (
            <button
              key={k.value}
              onClick={() => setKind(k.value)}
              aria-pressed={kind === k.value}
              className={cn(
                'rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors',
                kind === k.value
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-muted hover:text-ink',
              )}
            >
              {k.label}
            </button>
          ))}
        </div>

        <details className="group relative">
          <summary className="flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-control border border-border bg-surface px-3 text-xs font-medium text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
            <SlidersHorizontal size={14} />
            Sources
            {selectedSources.length ? (
              <span className="tabular rounded-pill bg-accent/15 px-1.5 text-2xs text-accent-ink">
                {selectedSources.length}
              </span>
            ) : null}
            <ChevronDown size={13} className="text-faint" />
          </summary>
          <div className="absolute left-0 z-20 mt-1.5 w-52 overflow-auto rounded-control border border-border bg-surface p-1 shadow-raised animate-fade-in">
            {selectedSources.length ? (
              <button
                onClick={() => setSelectedSources([])}
                className="mb-1 w-full rounded-[6px] px-2 py-1 text-left text-2xs text-accent hover:bg-surface-2"
              >
                Clear selection
              </button>
            ) : null}
            {sources.map((s) => (
              <label
                key={s}
                className="flex cursor-pointer items-center gap-2 rounded-[6px] px-2 py-1.5 text-xs hover:bg-surface-2"
              >
                <input
                  type="checkbox"
                  checked={selectedSources.includes(s)}
                  onChange={() => toggleSource(s)}
                  className="accent-[color:var(--accent)]"
                />
                <SourceBadge source={s} />
              </label>
            ))}
          </div>
        </details>
      </div>

      {groups.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No changes match these filters"
            hint="Changes are recorded whenever a scrape detects a different price or stock status."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(([day, items]) => (
            <section key={day} className="card card-raised">
              <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <h2 className="text-xs font-semibold text-ink">
                  {dayLabel(day)}
                </h2>
                <span className="tabular text-2xs text-muted">
                  {items.length} change{items.length === 1 ? '' : 's'}
                </span>
              </header>
              <ul className="divide-y divide-border px-4">
                {items.map((c) => (
                  <li key={c.id}>
                    <ChangeRow change={c} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
