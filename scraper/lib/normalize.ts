import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { ScrapedProduct } from '../types';

export interface NormalizedProduct extends ScrapedProduct {
  /** Hash of change-relevant fields only — drives idempotent diffing. */
  contentHash: string;
}

/** Resolve a possibly-relative URL against the source base; '' on failure. */
export function toAbsoluteUrl(base: string, maybe?: string): string | undefined {
  if (!maybe) return undefined;
  try {
    return new URL(maybe, base).toString();
  } catch {
    return undefined;
  }
}

/**
 * contentHash covers ONLY the fields whose change we want to record as history:
 * title, price, originalPrice, availability, imageUrl. Catalogue churn that
 * doesn't touch these (e.g. tag edits) produces no spurious PriceHistory rows.
 */
export function contentHashOf(p: {
  title?: string;
  price?: number;
  originalPrice?: number;
  availability?: string;
  imageUrl?: string;
}): string {
  const payload = JSON.stringify([
    p.title ?? '',
    p.price ?? null,
    p.originalPrice ?? null,
    p.availability ?? '',
    p.imageUrl ?? '',
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

const RawProductSchema = z.object({
  externalId: z.union([z.string(), z.number()]).transform(String),
  url: z.string().min(1),
  title: z.string().min(1),
  brand: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  currency: z.string().optional(),
  price: numberish,
  originalPrice: numberish,
  availability: z.string().optional(),
});

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
  const imageUrl = toAbsoluteUrl(base, p.imageUrl);

  // Drop a negative/garbage price rather than recording it.
  const price = p.price != null && p.price >= 0 ? p.price : undefined;
  const originalPrice =
    p.originalPrice != null && p.originalPrice >= 0 ? p.originalPrice : undefined;

  const normalized: ScrapedProduct = {
    externalId: p.externalId,
    url,
    title: p.title.trim(),
    brand: p.brand?.trim() || undefined,
    sku: p.sku?.trim() || undefined,
    category: p.category?.trim() || undefined,
    imageUrl,
    currency: p.currency?.trim() || undefined,
    price,
    originalPrice,
    availability: p.availability?.trim() || undefined,
  };

  return { ...normalized, contentHash: contentHashOf(normalized) };
}
