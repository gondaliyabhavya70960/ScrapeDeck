import { describe, it, expect } from 'vitest';
import {
  contentHashOf,
  toAbsoluteUrl,
  normalizeProduct,
} from '../lib/normalize';

describe('contentHashOf', () => {
  it('is stable for identical change-relevant fields', () => {
    const a = contentHashOf({ title: 'A', price: 100, availability: 'in_stock' });
    const b = contentHashOf({ title: 'A', price: 100, availability: 'in_stock' });
    expect(a).toBe(b);
  });

  it('changes when the price changes', () => {
    const a = contentHashOf({ title: 'A', price: 100, availability: 'in_stock' });
    const b = contentHashOf({ title: 'A', price: 120, availability: 'in_stock' });
    expect(a).not.toBe(b);
  });

  it('changes when availability changes', () => {
    const a = contentHashOf({ title: 'A', price: 100, availability: 'in_stock' });
    const b = contentHashOf({
      title: 'A',
      price: 100,
      availability: 'out_of_stock',
    });
    expect(a).not.toBe(b);
  });
});

describe('toAbsoluteUrl', () => {
  it('resolves relative paths against the base', () => {
    expect(toAbsoluteUrl('https://x.com', '/products/p1')).toBe(
      'https://x.com/products/p1',
    );
  });
  it('passes absolute URLs through', () => {
    expect(toAbsoluteUrl('https://x.com', 'https://cdn.io/a.jpg')).toBe(
      'https://cdn.io/a.jpg',
    );
  });
  it('returns undefined for empty input', () => {
    expect(toAbsoluteUrl('https://x.com', undefined)).toBeUndefined();
  });
});

describe('normalizeProduct', () => {
  it('coerces types and resolves relative URLs', () => {
    const p = normalizeProduct('https://x.com', {
      externalId: 42,
      url: '/products/p1',
      title: '  Resin Kit  ',
      imageUrl: '/img/a.jpg',
      price: '1200.50',
      availability: 'in_stock',
    });
    expect(p).not.toBeNull();
    expect(p!.externalId).toBe('42');
    expect(p!.url).toBe('https://x.com/products/p1');
    expect(p!.imageUrl).toBe('https://x.com/img/a.jpg');
    expect(p!.title).toBe('Resin Kit');
    expect(p!.price).toBe(1200.5);
    expect(p!.contentHash).toHaveLength(16);
  });

  it('drops records missing a required field', () => {
    expect(
      normalizeProduct('https://x.com', { externalId: 1, url: '/p', title: '' }),
    ).toBeNull();
  });

  it('drops a negative price rather than recording it', () => {
    const p = normalizeProduct('https://x.com', {
      externalId: 1,
      url: '/p',
      title: 'X',
      price: -5,
    });
    expect(p!.price).toBeUndefined();
  });
});
