import { TABS } from './sheets';
import type { NormalizedProduct } from './normalize';

/**
 * Pure read → diff → write logic, deliberately free of I/O and env so the merge
 * behaviour can be unit-tested against fixtures. The orchestrator and both
 * storage backends share these helpers.
 */

export type RunStatus = 'ok' | 'partial' | 'failed';

export interface ProductRow {
  sourceKey: string;
  vertical: string;
  externalId: string;
  title: string;
  slug: string;
  category: string;
  shortTagline: string;
  description: string;
  priceMin: number | '';
  priceMax: number | '';
  currency: string;
  showPrice: boolean;
  timeline: string;
  materials: string;
  dimensions: string;
  status: string;
  featured: boolean;
  images: string[];
  imageAlts: string[];
  fields: Record<string, string>;
  seoTitle: string;
  seoDescription: string;
  url: string;
  firstSeen: string;
  lastSeen: string;
  lastChanged: string;
  contentHash: string;
}

export interface HistoryRow {
  timestamp: string;
  sourceKey: string;
  externalId: string;
  title: string;
  currency: string;
  priceMin: number | '';
  priceMax: number | '';
  status: string;
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

/** Unique key for a product within the whole store: `${sourceKey}|${externalId}`. */
export function productKey(sourceKey: string, externalId: string): string {
  return `${sourceKey}|${externalId}`;
}

// ── (de)serialization helpers — match the §1 rules ──────────────────────────
const LIST_SEP = ' | ';
const numOrBlank = (v: string | undefined): number | '' => {
  if (v == null || v === '') return '';
  const n = Number(v);
  return Number.isFinite(n) ? n : '';
};
const splitList = (v: string | undefined): string[] =>
  v == null || v === ''
    ? []
    : v
        .split(LIST_SEP)
        .map((s) => s.trim())
        .filter(Boolean);
const parseBool = (v: string | undefined): boolean => /^true$/i.test(v ?? '');
const parseFields = (v: string | undefined): Record<string, string> => {
  if (!v) return {};
  try {
    const o = JSON.parse(v);
    return o && typeof o === 'object' ? (o as Record<string, string>) : {};
  } catch {
    return {};
  }
};
const numCell = (n: number | ''): number | '' => n;
const boolCell = (b: boolean): string => (b ? 'TRUE' : 'FALSE');

/** Parse a Products sheet row (string[]) into a typed ProductRow. */
export function rowToProduct(row: string[]): ProductRow {
  const at = (i: number) => row[i] ?? '';
  return {
    sourceKey: at(0),
    vertical: at(1),
    externalId: at(2),
    title: at(3),
    slug: at(4),
    category: at(5),
    shortTagline: at(6),
    description: at(7),
    priceMin: numOrBlank(at(8)),
    priceMax: numOrBlank(at(9)),
    currency: at(10),
    showPrice: parseBool(at(11)),
    timeline: at(12),
    materials: at(13),
    dimensions: at(14),
    status: at(15),
    featured: parseBool(at(16)),
    images: splitList(at(17)),
    imageAlts: splitList(at(18)),
    fields: parseFields(at(19)),
    seoTitle: at(20),
    seoDescription: at(21),
    url: at(22),
    firstSeen: at(23),
    lastSeen: at(24),
    lastChanged: at(25),
    contentHash: at(26),
  };
}

/** Serialize a ProductRow back to the sheet column order in TABS.Products. */
export function productToRow(p: ProductRow): (string | number)[] {
  return [
    p.sourceKey,
    p.vertical,
    p.externalId,
    p.title,
    p.slug,
    p.category,
    p.shortTagline,
    p.description,
    numCell(p.priceMin),
    numCell(p.priceMax),
    p.currency,
    boolCell(p.showPrice),
    p.timeline,
    p.materials,
    p.dimensions,
    p.status,
    boolCell(p.featured),
    p.images.join(LIST_SEP),
    p.imageAlts.join(LIST_SEP),
    JSON.stringify(p.fields ?? {}),
    p.seoTitle,
    p.seoDescription,
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
    h.sourceKey,
    h.externalId,
    h.title,
    h.currency,
    numCell(h.priceMin),
    numCell(h.priceMax),
    h.status,
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
const _assertProducts: 27 = TABS.Products.length;
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
  meta: { sourceKey: string; vertical: string },
  now: string,
): DiffResult {
  const isNew = !existing;
  const changed = !existing || existing.contentHash !== scraped.contentHash;
  const firstSeen = existing?.firstSeen || now;
  const lastChanged = changed ? now : existing?.lastChanged || now;

  const priceMin = scraped.priceMin ?? '';
  const priceMax = scraped.priceMax ?? '';
  const status = scraped.status ?? '';
  const currency = scraped.currency ?? '';

  const row: ProductRow = {
    sourceKey: meta.sourceKey,
    vertical: scraped.vertical || meta.vertical,
    externalId: scraped.externalId,
    title: scraped.title,
    slug: scraped.slug ?? '',
    category: scraped.category ?? '',
    shortTagline: scraped.shortTagline ?? '',
    description: scraped.description ?? '',
    priceMin,
    priceMax,
    currency,
    showPrice: scraped.showPrice ?? false,
    timeline: scraped.timeline ?? '',
    materials: scraped.materials ?? '',
    dimensions: scraped.dimensions ?? '',
    status,
    featured: scraped.featured ?? false,
    images: scraped.images ?? [],
    imageAlts: scraped.imageAlts ?? [],
    fields: scraped.fields ?? {},
    seoTitle: scraped.seoTitle ?? '',
    seoDescription: scraped.seoDescription ?? '',
    url: scraped.url,
    firstSeen,
    lastSeen: now,
    lastChanged,
    contentHash: scraped.contentHash,
  };

  const history: HistoryRow | undefined = changed
    ? {
        timestamp: now,
        sourceKey: meta.sourceKey,
        externalId: scraped.externalId,
        title: scraped.title,
        currency,
        priceMin,
        priceMax,
        status,
      }
    : undefined;

  return { row, changed, isNew, history };
}
