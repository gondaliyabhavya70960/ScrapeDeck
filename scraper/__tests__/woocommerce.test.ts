import { describe, it, expect } from 'vitest';
import { wooSource } from '../sources/woocommerce';
import { fakeContext } from './helpers';
import fixture from './fixtures/woocommerce.json';

describe('wooSource', () => {
  const adapter = wooSource({
    key: 'canvasbypriya',
    name: 'Canvas by Priya',
    baseUrl: 'https://canvasbypriya.in',
    vertical: 'resin',
  });

  it('converts minor units to rupee amounts (15000 / 10^2 = 150)', async () => {
    const products = await adapter.scrape(fakeContext(fixture));
    const kit = products.find((p) => p.externalId === '5')!;
    expect(kit.price).toBe(150);
    expect(kit.originalPrice).toBe(200);
    expect(kit.currency).toBe('INR');
    expect(kit.availability).toBe('in_stock');
    expect(kit.category).toBe('Kits');
  });

  it('maps is_in_stock=false to out_of_stock', async () => {
    const products = await adapter.scrape(fakeContext(fixture));
    const paste = products.find((p) => p.externalId === '6')!;
    expect(paste.price).toBe(500);
    expect(paste.availability).toBe('out_of_stock');
  });

  it('emits one row per product', async () => {
    const products = await adapter.scrape(fakeContext(fixture));
    expect(products).toHaveLength(2);
  });
});
