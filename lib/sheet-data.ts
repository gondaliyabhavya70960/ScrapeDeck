import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { sheetsClient, readRows, SHEET_ID } from '@/scraper/lib/sheets';
import type {
  Product,
  HistoryPoint,
  Run,
  ChangeEvent,
  PriceDelta,
  RunStatus,
  LoadResult,
} from './types';

const num = (s: string | undefined): number | null => {
  if (s == null || s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const str = (s: string | undefined): string => (s == null ? '' : String(s));
const splitList = (s: string | undefined): string[] =>
  s == null || s === ''
    ? []
    : s
        .split(' | ')
        .map((x) => x.trim())
        .filter(Boolean);
const parseBool = (s: string | undefined): boolean => /^true$/i.test(s ?? '');
const parseFields = (s: string | undefined): Record<string, string> => {
  if (!s) return {};
  try {
    const o = JSON.parse(s);
    return o && typeof o === 'object' ? (o as Record<string, string>) : {};
  } catch {
    return {};
  }
};

function parseProducts(rows: string[][]): Product[] {
  return rows
    .filter((r) => r[0] && r[2]) // need sourceKey + externalId
    .map((r) => ({
      key: `${r[0]}|${r[2]}`,
      source: str(r[0]),
      vertical: str(r[1]) || 'resin',
      externalId: str(r[2]),
      title: str(r[3]),
      slug: str(r[4]),
      category: str(r[5]),
      shortTagline: str(r[6]),
      description: str(r[7]),
      priceMin: num(r[8]),
      priceMax: num(r[9]),
      currency: str(r[10]) || 'INR',
      showPrice: parseBool(r[11]),
      timeline: str(r[12]),
      materials: str(r[13]),
      dimensions: str(r[14]),
      status: str(r[15]),
      featured: parseBool(r[16]),
      images: splitList(r[17]),
      imageAlts: splitList(r[18]),
      fields: parseFields(r[19]),
      seoTitle: str(r[20]),
      seoDescription: str(r[21]),
      url: str(r[22]),
      firstSeen: str(r[23]),
      lastSeen: str(r[24]),
      lastChanged: str(r[25]),
      contentHash: str(r[26]),
      delta: null as PriceDelta | null,
    }));
}

function parseHistory(rows: string[][]): HistoryPoint[] {
  return rows
    .filter((r) => r[0] && r[2])
    .map((r) => ({
      timestamp: str(r[0]),
      source: str(r[1]),
      externalId: str(r[2]),
      title: str(r[3]),
      currency: str(r[4]) || 'INR',
      priceMin: num(r[5]),
      priceMax: num(r[6]),
      status: str(r[7]),
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function parseRuns(rows: string[][]): Run[] {
  return rows
    .filter((r) => r[0] && r[1])
    .map((r) => ({
      timestamp: str(r[0]),
      source: str(r[1]),
      status: (str(r[2]) || 'ok') as RunStatus,
      found: num(r[3]) ?? 0,
      new: num(r[4]) ?? 0,
      changed: num(r[5]) ?? 0,
      durationMs: num(r[6]) ?? 0,
      error: str(r[7]),
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/** Price movement since the previous *different* recorded priceMin. */
function computeDelta(
  current: number | null,
  hist: HistoryPoint[],
): PriceDelta | null {
  if (current == null) return null;
  for (let i = hist.length - 1; i >= 0; i--) {
    const p = hist[i]!.priceMin;
    if (p != null && p !== current) {
      const amount = current - p;
      const pct = p !== 0 ? (amount / p) * 100 : 0;
      return {
        direction: amount >= 0 ? 'up' : 'down',
        amount,
        pct,
        previous: p,
      };
    }
  }
  return null;
}

/** Derive a change feed from consecutive history points per product. */
function buildChanges(
  byKey: Map<string, HistoryPoint[]>,
  products: Map<string, Product>,
): ChangeEvent[] {
  const out: ChangeEvent[] = [];
  for (const [key, hist] of byKey) {
    for (let i = 1; i < hist.length; i++) {
      const prev = hist[i - 1]!;
      const cur = hist[i]!;
      const priceChanged = prev.priceMin !== cur.priceMin;
      const statusChanged = prev.status !== cur.status;
      if (!priceChanged && !statusChanged) continue;

      const p = products.get(key);
      const amount =
        priceChanged && prev.priceMin != null && cur.priceMin != null
          ? cur.priceMin - prev.priceMin
          : null;
      const pct =
        amount != null && prev.priceMin
          ? (amount / prev.priceMin) * 100
          : null;

      out.push({
        id: `${key}@${cur.timestamp}#${i}`,
        timestamp: cur.timestamp,
        key,
        source: cur.source,
        vertical: p?.vertical ?? 'resin',
        externalId: cur.externalId,
        title: p?.title ?? cur.title,
        imageUrl: p?.images?.[0] ?? '',
        url: p?.url ?? '',
        currency: cur.currency,
        oldPrice: priceChanged ? prev.priceMin : null,
        newPrice: priceChanged ? cur.priceMin : null,
        pct,
        direction: amount == null ? null : amount >= 0 ? 'up' : 'down',
        oldStatus: statusChanged ? prev.status : null,
        newStatus: statusChanged ? cur.status : null,
      });
    }
  }
  return out.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 1000);
}

/**
 * Raw Sheet reads, cross-request cached for 10 minutes (honours the "read at
 * most every 10 min" constraint even though the views render dynamically).
 * Throws on failure so errors are NOT cached — they surface as the error state
 * and are retried on the next request.
 */
const readAllTabs = unstable_cache(
  async () => {
    const sheets = sheetsClient();
    const [pRows, hRows, rRows] = await Promise.all([
      readRows(sheets, SHEET_ID, 'Products'),
      readRows(sheets, SHEET_ID, 'PriceHistory'),
      readRows(sheets, SHEET_ID, 'Runs'),
    ]);
    return { pRows, hRows, rRows };
  },
  ['scrapedeck-sheet-tabs'],
  { revalidate: 600, tags: ['sheet'] },
);

async function loadDashboard(): Promise<LoadResult> {
  try {
    const { pRows, hRows, rRows } = await readAllTabs();

    const products = parseProducts(pRows);
    const history = parseHistory(hRows);
    const runs = parseRuns(rRows);

    // Index history by product key for deltas + change feed.
    const byKey = new Map<string, HistoryPoint[]>();
    for (const h of history) {
      const key = `${h.source}|${h.externalId}`;
      const arr = byKey.get(key);
      if (arr) arr.push(h);
      else byKey.set(key, [h]);
    }

    const productMap = new Map<string, Product>();
    for (const p of products) {
      p.delta = computeDelta(p.priceMin, byKey.get(p.key) ?? []);
      productMap.set(p.key, p);
    }

    const changes = buildChanges(byKey, productMap);

    const sources = [...new Set(products.map((p) => p.source))].sort();
    const verticals = [...new Set(products.map((p) => p.vertical))].sort();
    const lastSync =
      runs[0]?.timestamp ??
      products.reduce<string | null>(
        (acc, p) => (acc && acc > p.lastSeen ? acc : p.lastSeen || acc),
        null,
      );

    return {
      ok: true,
      products,
      history,
      runs,
      changes,
      sources,
      verticals,
      lastSync: lastSync ?? null,
      sheetUrl: SHEET_ID
        ? `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`
        : null,
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'Could not reach the Google Sheet.',
    };
  }
}

/** Request-deduplicated dashboard loader (React cache). */
export const getDashboardData = cache(loadDashboard);

/** Filter a loaded product list by the active vertical (`all` passes through). */
export function filterByVertical<T extends { vertical: string }>(
  items: T[],
  vertical: string,
): T[] {
  if (!vertical || vertical === 'all') return items;
  return items.filter((i) => i.vertical === vertical);
}
