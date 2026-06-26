import * as cheerio from 'cheerio';
import type { SourceAdapter, ScrapedProduct, ScrapeContext } from '../types';

/**
 * TEMPLATE — custom static-HTML source (cheerio, mode:'http').
 *
 * Copy this file to `<key>.ts`, fill in the TODO selectors for the target
 * store, then register it in sources/index.ts. Use this when `pnpm add-source`
 * reports an unknown platform whose product data is present in the server HTML
 * (Squarespace ?format=json, custom carts, etc.). For JS-rendered SPAs where
 * the HTML is near-empty, copy _template-browser.ts instead.
 */
export function templateHttpSource(cfg: {
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
      const MAX_PAGES = 100;

      for (let page = 1; page <= MAX_PAGES; page++) {
        // TODO: build the listing URL for this store's pagination scheme.
        const url = `${base}/collections/all?page=${page}`;
        const html = await ctx.limit(() => ctx.getHtml(url));
        const $ = cheerio.load(html);

        // TODO: selector matching one product card on the listing page.
        const cards = $('.product-card');
        if (cards.length === 0) break;

        cards.each((_, el) => {
          const card = $(el);
          // TODO: fill these selectors for the target store.
          const title = card.find('.product-card__title').text().trim();
          const href = card.find('a').attr('href') ?? '';
          const priceText = card.find('.price').first().text();
          const img = card.find('img').attr('src') ?? card.find('img').attr('data-src');

          if (!title || !href) return;
          const price = Number(priceText.replace(/[^0-9.]/g, '')) || undefined;
          // externalId: prefer a stable per-product id/handle from the URL.
          const externalId = href.split('/').filter(Boolean).pop() ?? href;

          out.push({
            externalId,
            url: href,
            title,
            slug: externalId,
            currency,
            priceMin: price,
            priceMax: price,
            showPrice: price != null && price > 0,
            status: 'active',
            images: img ? [img] : [],
            imageAlts: [],
          });
        });

        ctx.log(`[${cfg.key}] page ${page}: ${cards.length}`);
      }

      return out;
    },
  };
}
