import type { SourceAdapter, ScrapedProduct, ScrapeContext } from '../types';

/**
 * TEMPLATE — JS-rendered source (Playwright, mode:'browser').
 *
 * Copy to `<key>.ts`, fill the TODO selectors, register in sources/index.ts,
 * and set the repo variable USE_BROWSER=true so the workflow installs Chromium.
 * Use this only for SPAs whose product data is NOT in the server HTML; the HTTP
 * + cheerio template is lighter and should be preferred whenever it works.
 */
export function templateBrowserSource(cfg: {
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
    mode: 'browser',
    async scrape(ctx: ScrapeContext): Promise<ScrapedProduct[]> {
      const page = await ctx.getPage();
      const out: ScrapedProduct[] = [];

      try {
        // TODO: navigate to the listing/collection URL.
        await page.goto(`${base}/shop`, { waitUntil: 'networkidle' });
        // TODO: wait for the product grid to render.
        await page.waitForSelector('.product-card', { timeout: 15_000 });

        // TODO: extract product fields in the browser context.
        const items = await page.$$eval('.product-card', (cards) =>
          cards.map((card) => {
            const q = (sel: string) =>
              card.querySelector(sel)?.textContent?.trim() ?? '';
            const a = card.querySelector('a') as HTMLAnchorElement | null;
            const img = card.querySelector('img') as HTMLImageElement | null;
            return {
              title: q('.product-card__title'),
              href: a?.href ?? '',
              priceText: q('.price'),
              imageUrl: img?.src ?? '',
            };
          }),
        );

        for (const it of items) {
          if (!it.title || !it.href) continue;
          out.push({
            externalId: it.href.split('/').filter(Boolean).pop() ?? it.href,
            url: it.href,
            title: it.title,
            imageUrl: it.imageUrl || undefined,
            currency,
            price: Number(it.priceText.replace(/[^0-9.]/g, '')) || undefined,
          });
        }
        ctx.log(`[${cfg.key}] extracted ${out.length}`);
      } finally {
        await page.context().browser()?.close();
      }

      return out;
    },
  };
}
