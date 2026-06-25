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

  it('emits one row per variant and one row for variant-less products', async () => {
    const products = await adapter.scrape(fakeContext(fixture));
    // 2 variants for product 111 + 1 variant-less product 222.
    expect(products).toHaveLength(3);
  });

  it('keys variants as `${productId}:${variantId}` and builds product URLs', async () => {
    const products = await adapter.scrape(fakeContext(fixture));
    const v1 = products.find((p) => p.externalId === '111:9001');
    expect(v1).toBeDefined();
    expect(v1!.url).toBe('https://tulsiresin.com/products/epoxy-resin-1kg');
    expect(v1!.price).toBe(1200);
    expect(v1!.originalPrice).toBe(1500);
    expect(v1!.availability).toBe('in_stock');
    expect(v1!.brand).toBe('Tulsi');
    expect(v1!.category).toBe('Resin');
  });

  it('omits the "Default Title" suffix but keeps named variants', async () => {
    const products = await adapter.scrape(fakeContext(fixture));
    expect(products.find((p) => p.externalId === '111:9001')!.title).toBe(
      'Epoxy Resin 1kg',
    );
    expect(products.find((p) => p.externalId === '111:9002')!.title).toBe(
      'Epoxy Resin 1kg — 2kg',
    );
  });

  it('marks unavailable variants out_of_stock and skips null compare_at_price', async () => {
    const products = await adapter.scrape(fakeContext(fixture));
    const v2 = products.find((p) => p.externalId === '111:9002')!;
    expect(v2.availability).toBe('out_of_stock');
    expect(v2.originalPrice).toBeUndefined();
  });

  it('represents a variant-less product without a price', async () => {
    const products = await adapter.scrape(fakeContext(fixture));
    const bare = products.find((p) => p.externalId === '222')!;
    expect(bare.price).toBeUndefined();
    expect(bare.title).toBe('Mica Powder Set');
  });
});
