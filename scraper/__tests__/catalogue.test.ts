import { describe, it, expect } from 'vitest';
import {
  catalogue,
  CATALOGUE_HEADERS,
  catalogueToRow,
} from '../lib/catalogue';

describe('catalogue data integrity', () => {
  it('has products', () => {
    expect(catalogue.length).toBeGreaterThan(0);
  });

  it('serializes each product to a row matching the header count', () => {
    for (const p of catalogue) {
      expect(catalogueToRow(p)).toHaveLength(CATALOGUE_HEADERS.length);
    }
  });

  it('has unique slugs', () => {
    const slugs = catalogue.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('uses slug-safe identifiers', () => {
    for (const p of catalogue) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('has sane prices (0 < min <= max)', () => {
    for (const p of catalogue) {
      expect(p.priceMin).toBeGreaterThan(0);
      expect(p.priceMax).toBeGreaterThanOrEqual(p.priceMin);
    }
  });

  it('pairs every image with an alt text', () => {
    for (const p of catalogue) {
      expect(p.images.length).toBeGreaterThan(0);
      expect(p.imageAlts).toHaveLength(p.images.length);
    }
  });

  it('serializes fields/images as valid JSON', () => {
    for (const p of catalogue) {
      const row = catalogueToRow(p);
      // images, imageAlts, fields are JSON-encoded at indices 13, 14, 15
      expect(() => JSON.parse(String(row[13]))).not.toThrow();
      expect(() => JSON.parse(String(row[14]))).not.toThrow();
      expect(() => JSON.parse(String(row[15]))).not.toThrow();
    }
  });
});
