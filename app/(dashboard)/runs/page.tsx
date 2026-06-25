import { Clock, CalendarClock } from 'lucide-react';
import { getDashboardData } from '@/lib/sheet-data';
import { PageHeader } from '@/app/components/PageHeader';
import { ErrorState } from '@/app/components/ui/ErrorState';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { SourceBadge } from '@/app/components/ui/SourceBadge';
import { StatusPill } from '@/app/components/ui/StatusPill';
import {
  formatRelative,
  formatDateTime,
  formatDuration,
} from '@/lib/format';
import type { Run, RunStatus } from '@/lib/types';

export const revalidate = 600;

/** Next 02:00 UTC occurrence (matches the workflow cron). */
function nextScheduledRun(): Date {
  const now = new Date();
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      2,
      0,
      0,
    ),
  );
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

function worst(runs: Run[]): RunStatus {
  if (runs.some((r) => r.status === 'failed')) return 'failed';
  if (runs.some((r) => r.status === 'partial')) return 'partial';
  return 'ok';
}

export default async function RunsPage() {
  const data = await getDashboardData();

  if (!data.ok) {
    return (
      <>
        <PageHeader title="Runs" subtitle="Scrape run history" />
        <ErrorState detail={data.error} />
      </>
    );
  }

  // Group rows into run batches (one orchestrator run shares a timestamp).
  const batchesMap = new Map<string, Run[]>();
  for (const r of data.runs) {
    const arr = batchesMap.get(r.timestamp);
    if (arr) arr.push(r);
    else batchesMap.set(r.timestamp, [r]);
  }
  const batches = [...batchesMap.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 30);

  const next = nextScheduledRun();

  return (
    <>
      <PageHeader
        title="Runs"
        subtitle="Per-source scrape status, newest first"
      />

      {/* Header strip */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card card-raised flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-control bg-surface-2 text-accent">
            <Clock size={18} />
          </span>
          <div>
            <p className="text-2xs uppercase tracking-wide text-muted">
              Last sync
            </p>
            <p className="text-sm font-semibold text-ink">
              {formatRelative(data.lastSync)}
            </p>
            <p className="text-2xs text-faint">{formatDateTime(data.lastSync)}</p>
          </div>
        </div>
        <div className="card card-raised flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-control bg-surface-2 text-accent">
            <CalendarClock size={18} />
          </span>
          <div>
            <p className="text-2xs uppercase tracking-wide text-muted">
              Next scheduled run
            </p>
            <p className="text-sm font-semibold text-ink">
              {formatRelative(next.toISOString())}
            </p>
            <p className="text-2xs text-faint">
              {formatDateTime(next.toISOString())} · daily 02:00 UTC
              (best-effort)
            </p>
          </div>
        </div>
      </div>

      {batches.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No runs recorded yet"
            hint="Trigger the GitHub Action (workflow_dispatch) or run `pnpm scrape` locally."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {batches.map(([ts, runs]) => {
            const totals = runs.reduce(
              (a, r) => ({
                found: a.found + r.found,
                new: a.new + r.new,
                changed: a.changed + r.changed,
              }),
              { found: 0, new: 0, changed: 0 },
            );
            return (
              <section key={ts} className="card card-raised overflow-hidden">
                <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-2 px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <StatusPill status={worst(runs)} />
                    <span className="text-xs font-medium text-ink">
                      {formatDateTime(ts)}
                    </span>
                    <span className="text-2xs text-faint">
                      {formatRelative(ts)}
                    </span>
                  </div>
                  <span className="tabular text-2xs text-muted">
                    {totals.found} found · {totals.new} new · {totals.changed}{' '}
                    changed
                  </span>
                </header>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="text-muted">
                      <tr className="border-b border-border text-2xs uppercase tracking-wide">
                        <th className="px-4 py-2 text-left font-medium">
                          Source
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Status
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Found
                        </th>
                        <th className="px-4 py-2 text-right font-medium">New</th>
                        <th className="px-4 py-2 text-right font-medium">
                          Changed
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Duration
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {runs.map((r, i) => (
                        <tr key={`${r.source}-${i}`}>
                          <td className="px-4 py-2.5">
                            <SourceBadge source={r.source} />
                          </td>
                          <td className="px-4 py-2.5">
                            <StatusPill status={r.status} />
                          </td>
                          <td className="px-4 py-2.5 text-right tabular text-ink">
                            {r.found}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular text-ink">
                            {r.new}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular text-ink">
                            {r.changed}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular text-muted">
                            {formatDuration(r.durationMs)}
                          </td>
                          <td className="max-w-[220px] px-4 py-2.5">
                            {r.error ? (
                              <details className="text-xs">
                                <summary className="cursor-pointer text-up">
                                  Error
                                </summary>
                                <p className="mt-1 whitespace-pre-wrap break-words text-2xs text-muted">
                                  {r.error}
                                </p>
                              </details>
                            ) : (
                              <span className="text-faint">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
