import { fetch } from 'undici';
import type { RunRow } from './merge';
import type { Env } from './env';

/**
 * Optional Discord/Slack notification, fired only when there are changes or
 * failures worth a ping. Never throws into the run — notification is best
 * effort and its failure must not fail the scrape.
 */
export async function notify(env: Env, runs: RunRow[]): Promise<void> {
  if (!env.NOTIFY_WEBHOOK_URL || !env.NOTIFY_WEBHOOK_KIND) return;

  const totalChanged = runs.reduce((a, r) => a + r.changed, 0);
  const totalNew = runs.reduce((a, r) => a + r.new, 0);
  const failures = runs.filter((r) => r.status !== 'ok');

  if (totalChanged === 0 && totalNew === 0 && failures.length === 0) return;

  const lines = runs.map((r) => {
    const icon = r.status === 'ok' ? '🟢' : r.status === 'partial' ? '🟡' : '🔴';
    const tail = r.error ? ` — ${r.error}` : '';
    return `${icon} ${r.source}: ${r.found} found, ${r.new} new, ${r.changed} changed${tail}`;
  });

  const title = `ScrapeDeck — ${totalNew} new · ${totalChanged} changed${
    failures.length ? ` · ${failures.length} failing` : ''
  }`;
  const body = [title, '', ...lines].join('\n');

  const payload =
    env.NOTIFY_WEBHOOK_KIND === 'slack' ? { text: body } : { content: body };

  try {
    await fetch(env.NOTIFY_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('  notify failed (ignored):', (err as Error).message);
  }
}
