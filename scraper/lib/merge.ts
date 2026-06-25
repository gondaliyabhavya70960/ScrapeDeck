import { TABS } from './sheets';
import type { NormalizedProduct } from './normalize';

/**
 * Pure read → diff → write logic, deliberately free of I/O and env so the merge
 * behaviour can be unit-tested against fixtures. The orchestrator and both
 * storage backends share these helpers.
 */

export type RunStatus = 'ok' | 'partial' | 'failed';

export interface ProductRow {
  source: string;
  vertical: string;
  externalId: string;
  title: string;
  brand: string;
  sku: string;
  category: string;
  currency: string;
  price: number | '';
  originalPrice: number | '';
  availability: string;
  imageUrl: string;
  url: string;
  firstSeen: string;
  lastSeen: string;
  lastChanged: string;
  contentHash: string;
}

export interface HistoryRow {
  timestamp: string;
  source: string;
  externalId: string;
  title: string;
  currency: string;
  price: number | '';
  originalPrice: number | '';
  availability: string;
}

export interface RunRow {
  timestamp: string;
  source: string;
  status: RunStatus;
  found: number;
  new: number;
  changed: number;
  durationMs: number;
  error: string;
}

/** Unique key for a product within the whole store: `${source}|${externalId}`. */
export function productKey(source: string, externalId: string): string {
  return `${source}|${externalId}`;
}

const numOrBlank = (v: string | undefined): number | '' => {
  if (v == null || v === '') return '';
  const n = Number(v);
  return Number.isFinite(n) ? n : '';
};

/** Parse a Products sheet row (string[]) into a typed ProductRow. */
export function rowToProduct(row: string[]): ProductRow {
  const at = (i: number) => row[i] ?? '';
  return {
    source: at(0),
    vertical: at(1),
    externalId: at(2),
    title: at(3),
    brand: at(4),
    sku: at(5),
    category: at(6),
    currency: at(7),
    price: numOrBlank(at(8)),
    originalPrice: numOrBlank(at(9)),
    availability: at(10),
    imageUrl: at(11),
    url: at(12),
    firstSeen: at(13),
    lastSeen: at(14),
    lastChanged: at(15),
    contentHash: at(16),
  };
}

/** Serialize a ProductRow back to the sheet column order in TABS.Products. */
export function productToRow(p: ProductRow): (string | number)[] {
  return [
    p.source,
    p.vertical,
    p.externalId,
    p.title,
    p.brand,
    p.sku,
    p.category,
    p.currency,
    p.price,
    p.originalPrice,
    p.availability,
    p.imageUrl,
    p.url,
    p.firstSeen,
    p.lastSeen,
    p.lastChanged,
    p.contentHash,
  ];
}

export function historyToRow(h: HistoryRow): (string | number)[] {
  return [
    h.timestamp,
    h.source,
    h.externalId,
    h.title,
    h.currency,
    h.price,
    h.originalPrice,
    h.availability,
  ];
}

export function runToRow(r: RunRow): (string | number)[] {
  return [
    r.timestamp,
    r.source,
    r.status,
    r.found,
    r.new,
    r.changed,
    r.durationMs,
    r.error,
  ];
}

// Compile-time guard: header counts must match our serializers.
const _assertProducts: 17 = TABS.Products.length;
const _assertHistory: 8 = TABS.PriceHistory.length;
const _assertRuns: 8 = TABS.Runs.length;
void _assertProducts;
void _assertHistory;
void _assertRuns;

export interface DiffResult {
  row: ProductRow;
  changed: boolean;
  isNew: boolean;
  history?: HistoryRow;
}

/**
 * Diff one freshly-scraped product against its existing row (if any) and
 * produce the merged row. `firstSeen` is preserved; `lastChanged` only advances
 * when the contentHash differs, which also gates a PriceHistory entry.
 */
export function diffProduct(
  existing: ProductRow | undefined,
  scraped: NormalizedProduct,
  meta: { source: string; vertical: string },
  now: string,
): DiffResult {
  const isNew = !existing;
  const changed = !existing || existing.contentHash !== scraped.contentHash;
  const firstSeen = existing?.firstSeen || now;
  const lastChanged = changed ? now : existing?.lastChanged || now;

  const price = scraped.price ?? '';
  const originalPrice = scraped.originalPrice ?? '';
  const availability = scraped.availability ?? '';
  const currency = scraped.currency ?? '';

  const row: ProductRow = {
    source: meta.source,
    vertical: meta.vertical,
    externalId: scraped.externalId,
    title: scraped.title,
    brand: scraped.brand ?? '',
    sku: scraped.sku ?? '',
    category: scraped.category ?? '',
    currency,
    price,
    originalPrice,
    availability,
    imageUrl: scraped.imageUrl ?? '',
    url: scraped.url,
    firstSeen,
    lastSeen: now,
    lastChanged,
    contentHash: scraped.contentHash,
  };

  const history: HistoryRow | undefined = changed
    ? {
        timestamp: now,
        source: meta.source,
        externalId: scraped.externalId,
        title: scraped.title,
        currency,
        price,
        originalPrice,
        availability,
      }
    : undefined;

  return { row, changed, isNew, history };
}
