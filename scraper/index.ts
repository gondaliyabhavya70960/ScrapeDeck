import { appendFileSync } from 'node:fs';
import { loadEnv } from './lib/env';
import { createStorage } from './lib/storage';
import { createContext } from './lib/context';
import { normalizeProduct } from './lib/normalize';
import {
  productKey,
  rowToProduct,
  productToRow,
  historyToRow,
  runToRow,
  diffProduct,
  type ProductRow,
  type HistoryRow,
  type RunRow,
  type RunStatus,
} from './lib/merge';
import { notify } from './lib/notify';
import { closeBrowser } from './lib/browser';
import { sources } from './sources';

async function main() {
  const env = loadEnv();
  const now = new Date().toISOString();

  const storage = createStorage(env);
  console.log(`ScrapeDeck → ${storage.kind} (${storage.location})`);
  await storage.init();

  // ── Read current state ──────────────────────────────────────────────────
  // `existingMap` is the read-only snapshot of the previous run; `merged` is
  // seeded from a COPY of every existing row so untouched sources/products are
  // preserved through the whole-tab overwrite (critical: see gotcha #5).
  const existingRows = await storage.readProducts();
  const existingMap = new Map<string, ProductRow>();
  for (const raw of existingRows) {
    const p = rowToProduct(raw);
    if (!p.source || !p.externalId) continue;
    existingMap.set(productKey(p.source, p.externalId), p);
  }
  const merged = new Map<string, ProductRow>(existingMap);

  // ── Select sources ──────────────────────────────────────────────────────
  const active = sources.filter(
    (s) => s.enabled && (!env.ONLY || s.key === env.ONLY),
  );
  if (active.length === 0) {
    console.error(
      env.ONLY
        ? `✗ No enabled source matches ONLY=${env.ONLY}`
        : '✗ No enabled sources configured.',
    );
    process.exit(1);
  }
  console.log(
    `Scraping ${active.length} source(s): ${active.map((s) => s.key).join(', ')}\n`,
  );

  const historyRows: HistoryRow[] = [];
  const runRows: RunRow[] = [];

  // ── Per-source: isolated try/catch — one failure never aborts the rest ───
  for (const source of active) {
    const t0 = Date.now();
    let found = 0;
    let newCount = 0;
    let changedCount = 0;
    let dropped = 0;
    let status: RunStatus = 'ok';
    let error = '';

    try {
      const ctx = createContext(source);
      const scraped = await source.scrape(ctx);
      found = scraped.length;

      for (const raw of scraped) {
        const norm = normalizeProduct(source.baseUrl, raw, ctx.log);
        if (!norm) {
          dropped++;
          continue;
        }
        const key = productKey(source.key, norm.externalId);
        const { row, changed, isNew, history } = diffProduct(
          existingMap.get(key),
          norm,
          { source: source.key, vertical: source.vertical },
          now,
        );
        merged.set(key, row);
        if (history) historyRows.push(history);
        if (isNew) newCount++;
        else if (changed) changedCount++;
      }

      if (dropped > 0) status = 'partial';
      console.log(
        `✓ ${source.key}: ${found} found, ${newCount} new, ${changedCount} changed` +
          (dropped ? `, ${dropped} dropped` : ''),
      );
    } catch (err) {
      status = 'failed';
      error = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${source.key}: ${error}`);
    }

    runRows.push({
      timestamp: now,
      source: source.key,
      status,
      found,
      new: newCount,
      changed: changedCount,
      durationMs: Date.now() - t0,
      error,
    });
  }

  // ── Write back: whole-tab overwrite for Products, append for the logs ────
  const productRows = [...merged.values()]
    .sort((a, b) =>
      a.source === b.source
        ? a.externalId.localeCompare(b.externalId)
        : a.source.localeCompare(b.source),
    )
    .map(productToRow);

  await storage.writeProducts(productRows);
  await storage.appendHistory(historyRows.map(historyToRow));
  await storage.appendRuns(runRows.map(runToRow));

  // Release Chromium if any browser-mode source launched it (no-op otherwise).
  await closeBrowser();

  // ── Reporting ────────────────────────────────────────────────────────────
  writeStepSummary(env.GITHUB_STEP_SUMMARY, runRows, merged.size);
  await notify(env, runRows);

  const failed = runRows.filter((r) => r.status === 'failed').length;
  console.log(
    `\nDone. Products in store: ${merged.size}. ` +
      `History rows added: ${historyRows.length}. ` +
      `Sources: ${runRows.length - failed} ok/partial, ${failed} failed.`,
  );

  // Exit non-zero ONLY if every source failed.
  if (failed === runRows.length) {
    console.error('\nAll sources failed.');
    process.exit(1);
  }
}

function writeStepSummary(
  summaryPath: string | undefined,
  runs: RunRow[],
  totalProducts: number,
) {
  if (!summaryPath) return;
  const rows = runs
    .map(
      (r) =>
        `| ${r.source} | ${r.status} | ${r.found} | ${r.new} | ${r.changed} | ${r.durationMs}ms | ${
          r.error ? r.error.replace(/\|/g, '\\|').slice(0, 80) : '—'
        } |`,
    )
    .join('\n');
  const md = [
    `## ScrapeDeck run`,
    '',
    `**Products in store:** ${totalProducts}`,
    '',
    '| Source | Status | Found | New | Changed | Duration | Error |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    rows,
    '',
  ].join('\n');
  try {
    appendFileSync(summaryPath, md);
  } catch {
    /* summary is best-effort */
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
