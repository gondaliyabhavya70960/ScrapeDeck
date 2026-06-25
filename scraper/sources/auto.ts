import type { SourceAdapter, ScrapedProduct, ScrapeContext } from '../types';
import { shopifySource } from './shopify';
import { wooSource } from './woocommerce';

/**
 * Platform-agnostic source: probes for a Shopify (`/products.json`) then a
 * WooCommerce (`/wp-json/wc/store/v1/products`) feed at scrape time and delegates
 * to the matching verified adapter. Lets us register a site without knowing its
 * platform up front — useful for bulk competitor onboarding where fingerprinting
 * ahead of time isn't possible. Sites with neither feed (custom HTML, Wix,
 * marketplaces) throw and are recorded `failed` in Runs, flagging the ones that
 * need a bespoke adapter — without aborting the rest of the run.
 */
export function autoSource(cfg: {
  key: string;
  name: string;
  baseUrl: string;
  vertical?: string;
  enabled?: boolean;
  currency?: string;
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
      // Probe Shopify.
      try {
        const data = await ctx.limit(() =>
          ctx.getJson<{ products?: unknown[] }>(`${base}/products.json?limit=1`),
        );
        if (data && Array.isArray(data.products)) {
          ctx.log(`[${cfg.key}] detected Shopify`);
          return shopifySource(cfg).scrape(ctx);
        }
      } catch {
        /* not Shopify — fall through */
      }

      // Probe WooCommerce Store API.
      try {
        const data = await ctx.limit(() =>
          ctx.getJson<unknown[]>(
            `${base}/wp-json/wc/store/v1/products?per_page=1`,
          ),
        );
        if (Array.isArray(data)) {
          ctx.log(`[${cfg.key}] detected WooCommerce`);
          return wooSource(cfg).scrape(ctx);
        }
      } catch {
        /* not WooCommerce — fall through */
      }

      throw new Error(
        'no Shopify or WooCommerce product feed found (custom/marketplace site — needs a bespoke adapter)',
      );
    },
  };
}
