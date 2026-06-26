import { describe, it, expect } from 'vitest';
import { shopifySource } from '../sources/shopify';
import { fakeContext } from './helpers';
import fixture from './fixtures/shopify.json';

describe('shopifySource', () => {
  const adapter = shopifySource({
    key: 'tulsiresin',
    name: 'Tulsi Resin',
    baseUrl: 'https://tulsiresin.com',
    vertical: 'resin',
  });

  it('emits one row per product (not per variant)', async () => {
    const products = await adapter.scrape(fakeContext(fixture));
    expect(products).toHaveLength(2);
  });

  it('collapses variant prices into priceMin/priceMax and builds url + slug', async () => {
    const products = await adapter.scrape(fakeContext(fixture));
    const p = products.find((x) => x.externalId === '111')!;
    expect(p).toBeDefined();
    expect(p.url).toBe('https://tulsiresin.com/products/epoxy-resin-1kg');
    expect(p.slug).toBe('epoxy-resin-1kg');
    expect(p.priceMin).toBe(1200);
    expect(p.priceMax).toBe(2200);
    expect(p.showPrice).toBe(true);
    expect(p.category).toBe('Resin');
    expect(p.images).toContain('https://cdn.example.com/epoxy.jpg');
    expect(p.imageAlts).toContain('Epoxy bottle');
    expect(p.description).toContain('epoxy');
    expect(p.fields?.vendor).toBe('Tulsi');
  });

  it('marks a product active when any variant is available', async () => {
    const products = await adapter.scrape(fakeContext(fixture));
    expect(products.find((x) => x.externalId === '111')!.status).toBe('active');
  });

  it('marks a variant-less product out_of_stock with no price', async () => {
    const products = await adapter.scrape(fakeContext(fixture));
    const bare = products.find((x) => x.externalId === '222')!;
    expect(bare.status).toBe('out_of_stock');
    expect(bare.priceMin).toBeUndefined();
    expect(bare.title).toBe('Mica Powder Set');
  });
});
