import type { SourceAdapter, ScrapedProduct, ScrapeContext } from '../types';

interface ShopifyVariant {
  id: number;
  title: string;
  sku: string | null;
  price: string;
  compare_at_price: string | null;
  available: boolean;
}
interface ShopifyImage {
  src: string;
}
interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}
interface ProductsJson {
  products: ShopifyProduct[];
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
  return {
    key: cfg.key,
    name: cfg.name,
    baseUrl: base,
    vertical: cfg.vertical ?? 'resin',
    enabled: cfg.enabled ?? true,
    mode: 'http',
    async scrape(ctx: ScrapeContext): Promise<ScrapedProduct[]> {
      const out: ScrapedProduct[] = [];
      const PER_PAGE = 250,
        MAX_PAGES = 200;
      for (let page = 1; page <= MAX_PAGES; page++) {
        const url = `${base}/products.json?limit=${PER_PAGE}&page=${page}`;
        const data = await ctx.limit(() => ctx.getJson<ProductsJson>(url));
        const products = data.products ?? [];
        if (products.length === 0) break;
        for (const p of products) {
          const productUrl = `${base}/products/${p.handle}`;
          const imageUrl = p.images?.[0]?.src;
          const variants = p.variants ?? [];
          if (variants.length === 0) {
            out.push({
              externalId: String(p.id),
              url: productUrl,
              title: p.title,
              brand: p.vendor || undefined,
              category: p.product_type || undefined,
              imageUrl,
              currency,
            });
            continue;
          }
          for (const v of variants) {
            const vt =
              v.title && v.title !== 'Default Title' ? ` — ${v.title}` : '';
            out.push({
              externalId: `${p.id}:${v.id}`,
              url: productUrl,
              title: `${p.title}${vt}`,
              brand: p.vendor || undefined,
              sku: v.sku || undefined,
              category: p.product_type || undefined,
              imageUrl,
              currency,
              price: v.price != null ? Number(v.price) : undefined,
              originalPrice:
                v.compare_at_price != null
                  ? Number(v.compare_at_price)
                  : undefined,
              availability: v.available ? 'in_stock' : 'out_of_stock',
            });
          }
        }
        ctx.log(`[${cfg.key}] page ${page}: ${products.length}`);
        if (products.length < PER_PAGE) break;
      }
      return out;
    },
  };
}
