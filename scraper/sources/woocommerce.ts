import type { SourceAdapter, ScrapedProduct, ScrapeContext } from '../types';

interface WooImage {
  src: string;
}
interface WooCategory {
  name: string;
}
interface WooPrices {
  price: string;
  regular_price: string;
  sale_price: string;
  currency_code: string;
  currency_minor_unit: number;
}
interface WooProduct {
  id: number;
  name: string;
  permalink: string;
  sku: string;
  prices: WooPrices;
  images: WooImage[];
  categories: WooCategory[];
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
  return {
    key: cfg.key,
    name: cfg.name,
    baseUrl: base,
    vertical: cfg.vertical ?? 'resin',
    enabled: cfg.enabled ?? true,
    mode: 'http',
    async scrape(ctx: ScrapeContext): Promise<ScrapedProduct[]> {
      const out: ScrapedProduct[] = [];
      const PER_PAGE = 100,
        MAX_PAGES = 200;
      for (let page = 1; page <= MAX_PAGES; page++) {
        const url = `${base}/wp-json/wc/store/v1/products?per_page=${PER_PAGE}&page=${page}`;
        const products = await ctx.limit(() => ctx.getJson<WooProduct[]>(url));
        if (!Array.isArray(products) || products.length === 0) break;
        for (const p of products) {
          const minor = p.prices?.currency_minor_unit ?? 2; // prices are in MINOR units (15000 → ₹150.00)
          const div = Math.pow(10, minor);
          const amt = (s?: string) =>
            s != null && s !== '' ? Number(s) / div : undefined;
          out.push({
            externalId: String(p.id),
            url: p.permalink,
            title: p.name,
            sku: p.sku || undefined,
            category: p.categories?.[0]?.name || undefined,
            imageUrl: p.images?.[0]?.src || undefined,
            currency: p.prices?.currency_code || 'INR',
            price: amt(p.prices?.price),
            originalPrice: amt(p.prices?.regular_price),
            availability: p.is_in_stock ? 'in_stock' : 'out_of_stock',
          });
        }
        ctx.log(`[${cfg.key}] page ${page}: ${products.length}`);
        if (products.length < PER_PAGE) break;
      }
      return out;
    },
  };
}
