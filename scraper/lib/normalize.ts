import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { ScrapedProduct } from '../types';

export interface NormalizedProduct extends ScrapedProduct {
  /** Hash of change-relevant fields only — drives idempotent diffing. */
  contentHash: string;
}

/** Resolve a possibly-relative URL against the source base; undefined on failure. */
export function toAbsoluteUrl(base: string, maybe?: string): string | undefined {
  if (!maybe) return undefined;
  try {
    return new URL(maybe, base).toString();
  } catch {
    return undefined;
  }
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&nbsp;': ' ',
};

/**
 * Strip HTML to plain text. Drops <script>/<style> blocks, turns tags into
 * spaces, decodes the common entities, and collapses whitespace. Fast and safe
 * for the descriptions/taglines we pull from product feeds (no DOM needed).
 */
export function stripHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x?[0-9a-f]+;|&[a-z]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * contentHash covers ONLY the fields whose change we want to record as history:
 * title, priceMin, priceMax, status, and the image set. Description/SEO churn
 * that doesn't touch these produces no spurious PriceHistory rows.
 */
export function contentHashOf(p: {
  title?: string;
  priceMin?: number;
  priceMax?: number;
  status?: string;
  images?: string[];
}): string {
  const payload = JSON.stringify([
    p.title ?? '',
    p.priceMin ?? null,
    p.priceMax ?? null,
    p.status ?? '',
    (p.images ?? []).join('|'),
  ]);
  return createHash('sha1').update(payload).digest('hex').slice(0, 16);
}

const numberish = z
  .union([z.number(), z.string()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === '') return undefined;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : undefined;
  });

const stringArray = z
  .array(z.union([z.string(), z.null()]))
  .optional()
  .transform((a) => (a ?? []).map((s) => s ?? ''));

const RawProductSchema = z.object({
  externalId: z.union([z.string(), z.number()]).transform(String),
  url: z.string().min(1),
  sourceKey: z.string().optional(),
  vertical: z.string().optional(),
  currency: z.string().optional(),
  title: z.string().min(1),
  slug: z.string().optional(),
  category: z.string().optional(),
  shortTagline: z.string().optional(),
  description: z.string().optional(),
  priceMin: numberish,
  priceMax: numberish,
  showPrice: z.boolean().optional(),
  timeline: z.string().optional(),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  status: z.string().optional(),
  featured: z.boolean().optional(),
  images: stringArray,
  imageAlts: stringArray,
  fields: z.record(z.string()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

const clean = (s?: string) => {
  const t = s?.trim();
  return t ? t : undefined;
};
const nonNeg = (n?: number) => (n != null && n >= 0 ? n : undefined);

/**
 * Validate + coerce a raw adapter product into a NormalizedProduct.
 * Resolves relative URLs against `base`, drops invalid records (logging why),
 * and attaches the contentHash. Returns null for unusable records.
 */
export function normalizeProduct(
  base: string,
  raw: unknown,
  log: (msg: string, meta?: unknown) => void = () => {},
): NormalizedProduct | null {
  const parsed = RawProductSchema.safeParse(raw);
  if (!parsed.success) {
    log('dropped invalid product', {
      issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return null;
  }
  const p = parsed.data;

  const url = toAbsoluteUrl(base, p.url);
  if (!url) {
    log('dropped product with unresolvable url', { url: p.url, title: p.title });
    return null;
  }

  const images = p.images
    .map((src) => toAbsoluteUrl(base, src))
    .filter((u): u is string => !!u);
  // Keep alts aligned with images only when the counts already match; a feed
  // that supplies alts maps them 1:1, otherwise we drop the (now-misaligned) alts.
  const imageAlts =
    p.imageAlts.length === p.images.length
      ? p.imageAlts.filter((_, i) => !!toAbsoluteUrl(base, p.images[i]))
      : [];

  const priceMin = nonNeg(p.priceMin);
  const priceMax = nonNeg(p.priceMax);
  const showPrice = p.showPrice ?? (priceMin != null && priceMin > 0);

  const normalized: ScrapedProduct = {
    externalId: p.externalId,
    url,
    sourceKey: clean(p.sourceKey),
    vertical: clean(p.vertical),
    currency: clean(p.currency),
    title: p.title.trim(),
    slug: clean(p.slug) ?? '',
    category: clean(p.category),
    shortTagline: clean(p.shortTagline),
    description: clean(p.description),
    priceMin,
    priceMax,
    showPrice,
    timeline: clean(p.timeline),
    materials: clean(p.materials),
    dimensions: clean(p.dimensions),
    status: clean(p.status),
    featured: p.featured ?? false,
    images,
    imageAlts,
    fields: p.fields,
    seoTitle: clean(p.seoTitle),
    seoDescription: clean(p.seoDescription),
  };

  return { ...normalized, contentHash: contentHashOf(normalized) };
}
