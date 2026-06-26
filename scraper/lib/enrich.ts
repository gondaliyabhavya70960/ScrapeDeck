import * as cheerio from 'cheerio';
import type { ScrapeContext, ScrapedProduct } from '../types';

/**
 * Optional SEO/meta enrichment. Fetches ONE product HTML page and lifts the
 * <title> / meta description / og:* tags into seoTitle / seoDescription (and, as
 * a fallback, a first-sentence shortTagline and an og:image). One request per
 * product, so this is opt-in and capped by the orchestrator (ENRICH config) —
 * never run blindly across thousands of products. Failures are swallowed: a
 * product simply keeps its empty SEO fields.
 */
export async function enrichSeo(
  ctx: ScrapeContext,
  p: ScrapedProduct,
): Promise<ScrapedProduct> {
  try {
    const $ = cheerio.load(await ctx.limit(() => ctx.getHtml(p.url)));
    p.seoTitle =
      p.seoTitle ||
      $('title').first().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      undefined;
    p.seoDescription =
      p.seoDescription ||
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      undefined;
    if (!p.shortTagline && p.seoDescription) {
      p.shortTagline = p.seoDescription.split(/(?<=[.!?])\s/)[0];
    }
    if (!p.images?.length) {
      const og = $('meta[property="og:image"]').attr('content');
      if (og) p.images = [og];
    }
  } catch {
    ctx.log(`enrich failed: ${p.url}`);
  }
  return p;
}

/**
 * Pick which scraped products to enrich for a source, honouring the ENRICH
 * config: 'all', 'featured' only, or a numeric cap (first N). 'off' is handled
 * by the orchestrator before calling this.
 */
export function selectForEnrich(
  products: ScrapedProduct[],
  enrich: string,
): ScrapedProduct[] {
  if (enrich === 'all') return products;
  if (enrich === 'featured') return products.filter((p) => p.featured);
  const cap = Number(enrich);
  if (Number.isFinite(cap) && cap > 0) return products.slice(0, cap);
  return [];
}
