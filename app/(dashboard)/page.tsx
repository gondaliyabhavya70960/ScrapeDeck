import Link from 'next/link';
import {
  Package,
  Store,
  Sparkles,
  IndianRupee,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { getDashboardData, filterByVertical } from '@/lib/sheet-data';
import { PageHeader } from '@/app/components/PageHeader';
import { DownloadButton } from '@/app/components/DownloadButton';
import { StatCard } from '@/app/components/ui/StatCard';
import { Sparkline } from '@/app/components/ui/Sparkline';
import { SourceBadge } from '@/app/components/ui/SourceBadge';
import { StatusPill } from '@/app/components/ui/StatusPill';
import { ChangeRow } from '@/app/components/ChangeRow';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { ErrorState } from '@/app/components/ui/ErrorState';
import { formatPrice, formatRelative, verticalLabel } from '@/lib/format';
import type { RunStatus } from '@/lib/types';

export const revalidate = 600;

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: { v?: string };
}) {
  const data = await getDashboardData();
  const vertical = searchParams.v ?? 'all';
  const verticalName = vertical === 'all' ? 'all verticals' : verticalLabel(vertical);

  if (!data.ok) {
    return (
      <>
        <PageHeader title="Overview" subtitle="Catalogue & price monitoring" />
        <ErrorState detail={data.error} />
      </>
    );
  }

  const products = filterByVertical(data.products, vertical);
  const changes = filterByVertical(data.changes, vertical);
  const today = dayKey(new Date().toISOString());

  const priced = products.filter((p) => p.price != null);
  const avgPrice =
    priced.length > 0
      ? priced.reduce((a, p) => a + (p.price ?? 0), 0) / priced.length
      : null;
  const currency = priced[0]?.currency ?? 'INR';
  const sourceCount = new Set(products.map((p) => p.source)).size;
  const changedToday = changes.filter((c) => dayKey(c.timestamp) === today).length;

  // 7-day movement sparkline (changes per day, oldest → newest).
  const buckets: { key: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    buckets.push({ key: d.toISOString().slice(0, 10), count: 0 });
  }
  const bucketIndex = new Map(buckets.map((b, i) => [b.key, i]));
  for (const c of changes) {
    const idx = bucketIndex.get(dayKey(c.timestamp));
    if (idx != null) buckets[idx]!.count++;
  }
  const movements7d = buckets.reduce((a, b) => a + b.count, 0);

  // Source health: latest run status per source.
  const latestBySource = new Map<string, RunStatus>();
  for (const r of data.runs) {
    if (!latestBySource.has(r.source)) latestBySource.set(r.source, r.status);
  }
  const lastRun = data.runs[0];
  const worstStatus: RunStatus = data.runs.some((r) => r.status === 'failed')
    ? 'failed'
    : data.runs.some((r) => r.status === 'partial')
      ? 'partial'
      : 'ok';

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={`Tracking ${products.length.toLocaleString('en-IN')} products across ${verticalName}`}
        actions={
          <DownloadButton query={vertical !== 'all' ? `v=${vertical}` : ''} />
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Products"
          value={products.length.toLocaleString('en-IN')}
          icon={<Package size={16} />}
        />
        <StatCard
          label="Sources"
          value={sourceCount}
          icon={<Store size={16} />}
        />
        <StatCard
          label="Changed today"
          value={changedToday}
          tone={changedToday > 0 ? 'warn' : 'default'}
          icon={<Sparkles size={16} />}
        />
        <StatCard
          label="Avg price"
          value={avgPrice != null ? formatPrice(avgPrice, currency) : '—'}
          sub={vertical === 'all' ? 'across all verticals' : verticalName}
          icon={<IndianRupee size={16} />}
        />
        <StatCard
          label="Last run"
          value={<StatusPill status={worstStatus} />}
          sub={lastRun ? formatRelative(lastRun.timestamp) : 'no runs yet'}
          icon={<Activity size={16} />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Recent changes */}
        <section className="card card-raised lg:col-span-7">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Recent changes</h2>
            <Link
              href={vertical !== 'all' ? `/changes?v=${vertical}` : '/changes'}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              View all <ArrowRight size={13} />
            </Link>
          </header>
          <div className="px-4">
            {changes.length === 0 ? (
              <EmptyState
                title="No changes recorded yet"
                hint="Price and stock changes appear here after the next scrape detects them."
              />
            ) : (
              <ul className="divide-y divide-border">
                {changes.slice(0, 7).map((c) => (
                  <li key={c.id}>
                    <ChangeRow change={c} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Right column */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <section className="card card-raised p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  7-day movements
                </h2>
                <p className="mt-0.5 text-2xs text-muted">
                  Price &amp; stock changes detected
                </p>
              </div>
              <span className="tabular text-2xl font-semibold text-ink">
                {movements7d}
              </span>
            </div>
            <div className="mt-3">
              <Sparkline
                values={buckets.map((b) => b.count)}
                width={320}
                height={56}
              />
              <div className="mt-1 flex justify-between text-2xs text-faint">
                <span>{formatRelative(buckets[0]!.key + 'T12:00:00Z')}</span>
                <span>today</span>
              </div>
            </div>
          </section>

          <section className="card card-raised p-4">
            <h2 className="text-sm font-semibold text-ink">Source health</h2>
            <p className="mt-0.5 text-2xs text-muted">Status of the last run</p>
            <ul className="mt-3 flex flex-col gap-2">
              {data.sources.length === 0 ? (
                <li className="text-xs text-faint">No sources have run yet.</li>
              ) : (
                data.sources.map((s) => (
                  <li key={s} className="flex items-center justify-between">
                    <SourceBadge source={s} />
                    <StatusPill status={latestBySource.get(s) ?? 'ok'} />
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
