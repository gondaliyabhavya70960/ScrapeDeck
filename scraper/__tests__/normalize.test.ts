import { describe, it, expect } from 'vitest';
import {
  contentHashOf,
  stripHtml,
  toAbsoluteUrl,
  normalizeProduct,
} from '../lib/normalize';

describe('contentHashOf', () => {
  it('is stable for identical change-relevant fields', () => {
    const a = contentHashOf({ title: 'A', priceMin: 100, status: 'active' });
    const b = contentHashOf({ title: 'A', priceMin: 100, status: 'active' });
    expect(a).toBe(b);
  });

  it('changes when the price changes', () => {
    const a = contentHashOf({ title: 'A', priceMin: 100 });
    const b = contentHashOf({ title: 'A', priceMin: 120 });
    expect(a).not.toBe(b);
  });

  it('changes when status changes', () => {
    const a = contentHashOf({ title: 'A', priceMin: 100, status: 'active' });
    const b = contentHashOf({
      title: 'A',
      priceMin: 100,
      status: 'out_of_stock',
    });
    expect(a).not.toBe(b);
  });

  it('changes when the image set changes', () => {
    const a = contentHashOf({ title: 'A', images: ['a.jpg'] });
    const b = contentHashOf({ title: 'A', images: ['b.jpg'] });
    expect(a).not.toBe(b);
  });
});

describe('stripHtml', () => {
  it('removes tags, decodes entities and collapses whitespace', () => {
    expect(stripHtml('<p>Clear <strong>epoxy</strong> &amp; craft.</p>')).toBe(
      'Clear epoxy & craft.',
    );
  });
  it('drops script/style blocks', () => {
    expect(stripHtml('<style>x{}</style>Hello<script>1</script>')).toBe('Hello');
  });
  it('returns empty string for undefined', () => {
    expect(stripHtml(undefined)).toBe('');
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
  it('coerces types and resolves relative url + images', () => {
    const p = normalizeProduct('https://x.com', {
      externalId: 42,
      url: '/products/p1',
      title: '  Resin Kit  ',
      slug: 'resin-kit',
      images: ['/img/a.jpg', 'https://cdn.io/b.jpg'],
      priceMin: '1200.50',
      priceMax: '1800',
      status: 'active',
    });
    expect(p).not.toBeNull();
    expect(p!.externalId).toBe('42');
    expect(p!.url).toBe('https://x.com/products/p1');
    expect(p!.images).toEqual([
      'https://x.com/img/a.jpg',
      'https://cdn.io/b.jpg',
    ]);
    expect(p!.title).toBe('Resin Kit');
    expect(p!.priceMin).toBe(1200.5);
    expect(p!.priceMax).toBe(1800);
    expect(p!.showPrice).toBe(true);
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
      slug: 'x',
      priceMin: -5,
    });
    expect(p!.priceMin).toBeUndefined();
  });
});
