import type { SourceAdapter, ScrapedProduct, ScrapeContext } from '../types';
import { stripHtml } from '../lib/normalize';

interface SVariant {
  price: string;
  compare_at_price: string | null;
  available: boolean;
}
interface SImage {
  src: string;
  alt: string | null;
}
interface SProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: SVariant[];
  images: SImage[];
}
interface ProductsJson {
  products: SProduct[];
}

export function shopifySource(cfg: {
  key: string;
  name: string;
  baseUrl: string;
  vertical?: string;
  enabled?: boolean;
  currency?: string;
}): SourceAdapter {
  const base = cfg.baseUrl.replace(/\/+$/, '');
  const currency = cfg.currency ?? 'INR';
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
      const PER_PAGE = 250,
        MAX_PAGES = 200;
      for (let page = 1; page <= MAX_PAGES; page++) {
        const data = await ctx.limit(() =>
          ctx.getJson<ProductsJson>(
            `${base}/products.json?limit=${PER_PAGE}&page=${page}`,
          ),
        );
        const products = data.products ?? [];
        if (products.length === 0) break;
        for (const p of products) {
          const prices = (p.variants ?? [])
            .map((v) => Number(v.price))
            .filter((n) => !Number.isNaN(n));
          const priceMin = prices.length ? Math.min(...prices) : undefined;
          const priceMax = prices.length ? Math.max(...prices) : undefined;
          const inStock = (p.variants ?? []).some((v) => v.available);
          out.push({
            externalId: String(p.id),
            url: `${base}/products/${p.handle}`,
            vertical,
            currency,
            title: p.title,
            slug: p.handle,
            category: p.product_type || p.tags?.[0] || undefined,
            description: stripHtml(p.body_html),
            shortTagline: undefined, // enrichment may fill
            priceMin,
            priceMax,
            showPrice: priceMin != null && priceMin > 0,
            status: inStock ? 'active' : 'out_of_stock',
            featured: (p.tags ?? []).some((t) => /feature/i.test(t)),
            images: (p.images ?? []).map((i) => i.src),
            imageAlts: (p.images ?? []).map((i) => i.alt ?? ''),
            fields: {
              vendor: p.vendor ?? '',
              productType: p.product_type ?? '',
              tags: (p.tags ?? []).join(', '),
            },
            materials: undefined,
            dimensions: undefined,
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
