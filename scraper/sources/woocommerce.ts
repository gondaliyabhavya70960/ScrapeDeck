import type { SourceAdapter, ScrapedProduct, ScrapeContext } from '../types';
import { stripHtml } from '../lib/normalize';

interface WImage {
  src: string;
  alt: string | null;
}
interface WCat {
  name: string;
}
interface WTerm {
  name: string;
}
interface WAttr {
  name: string;
  terms: WTerm[];
}
interface WRange {
  min_amount: string;
  max_amount: string;
}
interface WPrices {
  price: string;
  regular_price: string;
  currency_code: string;
  currency_minor_unit: number;
  price_range: WRange | null;
}
interface WProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  short_description: string;
  description: string;
  prices: WPrices;
  images: WImage[];
  categories: WCat[];
  attributes: WAttr[];
  is_in_stock: boolean;
}

export function wooSource(cfg: {
  key: string;
  name: string;
  baseUrl: string;
  vertical?: string;
  enabled?: boolean;
}): SourceAdapter {
  const base = cfg.baseUrl.replace(/\/+$/, '');
  const vertical = cfg.vertical ?? 'resin';
  return {
    key: cfg.key,
    name: cfg.name,
    baseUrl: base,
    vertical,
    enabled: cfg.enabled ?? true,
    mode: 'http',
    async scrape(ctx: ScrapeContext): Promise<ScrapedProduct[]> {
      const out: ScrapedProduct[] = [];
      const PER_PAGE = 100,
        MAX_PAGES = 200;
      for (let page = 1; page <= MAX_PAGES; page++) {
        const products = await ctx.limit(() =>
          ctx.getJson<WProduct[]>(
            `${base}/wp-json/wc/store/v1/products?per_page=${PER_PAGE}&page=${page}`,
          ),
        );
        if (!Array.isArray(products) || products.length === 0) break;
        for (const p of products) {
          const minor = p.prices?.currency_minor_unit ?? 2;
          const div = Math.pow(10, minor);
          const amt = (s?: string) =>
            s != null && s !== '' ? Number(s) / div : undefined;
          let priceMin: number | undefined, priceMax: number | undefined;
          if (p.prices?.price_range) {
            priceMin = amt(p.prices.price_range.min_amount);
            priceMax = amt(p.prices.price_range.max_amount);
          } else {
            priceMin = priceMax = amt(p.prices?.price);
          }

          const fields: Record<string, string> = {};
          let materials: string | undefined, dimensions: string | undefined;
          for (const a of p.attributes ?? []) {
            const val = (a.terms ?? []).map((t) => t.name).join(', ');
            if (a.name) fields[a.name] = val;
            if (/material/i.test(a.name)) materials = val;
            if (/(dimension|size)/i.test(a.name)) dimensions = val;
          }

          out.push({
            externalId: String(p.id),
            url: p.permalink,
            vertical,
            currency: p.prices?.currency_code || 'INR',
            title: p.name,
            slug: p.slug,
            category: p.categories?.[0]?.name || undefined,
            shortTagline: stripHtml(p.short_description) || undefined,
            description: stripHtml(p.description) || undefined,
            priceMin,
            priceMax,
            showPrice: priceMin != null && priceMin > 0,
            status: p.is_in_stock ? 'active' : 'out_of_stock',
            featured: false,
            images: (p.images ?? []).map((i) => i.src),
            imageAlts: (p.images ?? []).map((i) => i.alt ?? ''),
            fields,
            materials,
            dimensions,
            timeline: undefined,
            seoTitle: undefined,
            seoDescription: undefined,
          });
        }
        ctx.log(`[${cfg.key}] page ${page}: ${products.length}`);
        if (products.length < PER_PAGE) break;
      }
      return out;
    },
  };
}
