import { describe, it, expect } from 'vitest';
import {
  diffProduct,
  productToRow,
  rowToProduct,
  productKey,
} from '../lib/merge';
import { contentHashOf, type NormalizedProduct } from '../lib/normalize';

const META = { sourceKey: 'rabh', vertical: 'resin' };

function mk(overrides: Partial<NormalizedProduct> = {}): NormalizedProduct {
  const base = {
    externalId: '1',
    url: 'https://www.rabh.in/products/p1',
    title: 'Resin 1kg',
    slug: 'p1',
    images: ['https://www.rabh.in/img/p1.jpg'],
    imageAlts: [] as string[],
    fields: { vendor: 'RABH' },
    currency: 'INR',
    priceMin: 100 as number | undefined,
    priceMax: 100 as number | undefined,
    status: 'active',
    showPrice: true,
    featured: false,
    ...overrides,
  };
  return {
    ...base,
    contentHash: contentHashOf(base),
  };
}

describe('diffProduct', () => {
  it('treats a never-seen product as new + changed with a history row', () => {
    const r = diffProduct(undefined, mk(), META, 't1');
    expect(r.isNew).toBe(true);
    expect(r.changed).toBe(true);
    expect(r.history).toBeDefined();
    expect(r.row.firstSeen).toBe('t1');
    expect(r.row.lastSeen).toBe('t1');
    expect(r.row.lastChanged).toBe('t1');
    expect(r.row.vertical).toBe('resin');
    expect(r.row.sourceKey).toBe('rabh');
  });

  it('is idempotent: re-scraping unchanged data writes no history', () => {
    const first = diffProduct(undefined, mk(), META, 't1');
    const second = diffProduct(first.row, mk(), META, 't2');
    expect(second.isNew).toBe(false);
    expect(second.changed).toBe(false);
    expect(second.history).toBeUndefined();
    // firstSeen + lastChanged preserved; only lastSeen advances.
    expect(second.row.firstSeen).toBe('t1');
    expect(second.row.lastChanged).toBe('t1');
    expect(second.row.lastSeen).toBe('t2');
  });

  it('records a change (and history) when the price moves', () => {
    const first = diffProduct(undefined, mk({ priceMin: 100, priceMax: 100 }), META, 't1');
    const moved = diffProduct(
      first.row,
      mk({ priceMin: 120, priceMax: 120 }),
      META,
      't3',
    );
    expect(moved.changed).toBe(true);
    expect(moved.history).toBeDefined();
    expect(moved.history!.priceMin).toBe(120);
    expect(moved.row.lastChanged).toBe('t3');
    expect(moved.row.firstSeen).toBe('t1'); // preserved across the change
  });
});

describe('row (de)serialization', () => {
  it('round-trips a ProductRow through the sheet representation', () => {
    const { row } = diffProduct(
      undefined,
      mk({ priceMin: 1999.5, priceMax: 2999 }),
      META,
      't1',
    );
    const serialized = productToRow(row).map(String);
    const parsed = rowToProduct(serialized);
    expect(parsed.sourceKey).toBe('rabh');
    expect(parsed.externalId).toBe('1');
    expect(parsed.priceMin).toBe(1999.5);
    expect(parsed.priceMax).toBe(2999);
    expect(parsed.status).toBe('active');
    expect(parsed.showPrice).toBe(true);
    expect(parsed.images).toEqual(['https://www.rabh.in/img/p1.jpg']);
    expect(parsed.fields).toEqual({ vendor: 'RABH' });
    expect(parsed.contentHash).toBe(row.contentHash);
  });

  it('builds the composite product key', () => {
    expect(productKey('rabh', '111')).toBe('rabh|111');
  });
});
