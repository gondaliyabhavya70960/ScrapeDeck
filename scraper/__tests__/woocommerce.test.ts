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
    expect(kit.priceMin).toBe(150);
    expect(kit.priceMax).toBe(150);
    expect(kit.currency).toBe('INR');
    expect(kit.status).toBe('active');
    expect(kit.category).toBe('Kits');
    expect(kit.slug).toBe('resin-art-kit');
    expect(kit.shortTagline).toBe('Everything to start.');
  });

  it('maps attributes into materials / dimensions / fields', async () => {
    const products = await adapter.scrape(fakeContext(fixture));
    const kit = products.find((p) => p.externalId === '5')!;
    expect(kit.materials).toBe('Epoxy');
    expect(kit.dimensions).toBe('A4');
    expect(kit.fields?.Material).toBe('Epoxy');
  });

  it('reads a price_range into priceMin/priceMax and maps out_of_stock', async () => {
    const products = await adapter.scrape(fakeContext(fixture));
    const paste = products.find((p) => p.externalId === '6')!;
    expect(paste.priceMin).toBe(500);
    expect(paste.priceMax).toBe(800);
    expect(paste.status).toBe('out_of_stock');
  });

  it('emits one row per product', async () => {
    const products = await adapter.scrape(fakeContext(fixture));
    expect(products).toHaveLength(2);
  });
});
