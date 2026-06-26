import { describe, it, expect } from 'vitest';
import { autoSource } from '../sources/auto';
import { fakeContext } from './helpers';
import type { ScrapeContext } from '../types';
import shopifyFixture from './fixtures/shopify.json';
import wooFixture from './fixtures/woocommerce.json';

const cfg = {
  key: 'x',
  name: 'X',
  baseUrl: 'https://example.com',
  vertical: 'resin',
};

describe('autoSource', () => {
  it('detects Shopify and delegates to the Shopify adapter', async () => {
    const products = await autoSource(cfg).scrape(fakeContext(shopifyFixture));
    expect(products).toHaveLength(2); // one row per product
    expect(products.some((p) => p.externalId === '111')).toBe(true);
  });

  it('detects WooCommerce and delegates to the Woo adapter', async () => {
    const products = await autoSource(cfg).scrape(fakeContext(wooFixture));
    expect(products).toHaveLength(2);
    expect(products.find((p) => p.externalId === '5')!.priceMin).toBe(150);
  });

  it('throws for a site with neither feed (recorded as failed, not fatal)', async () => {
    const customCtx: ScrapeContext = {
      getHtml: async () => '<html>custom site</html>',
      getJson: async () => {
        throw new Error('404');
      },
      getPage: async () => {
        throw new Error('no browser');
      },
      limit: (fn) => fn(),
      log: () => {},
    };
    await expect(autoSource(cfg).scrape(customCtx)).rejects.toThrow(
      /no Shopify or WooCommerce/,
    );
  });
});
