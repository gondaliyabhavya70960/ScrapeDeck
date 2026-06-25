import { describe, it, expect } from 'vitest';
import { matches } from '../lib/robots';

describe('robots matches()', () => {
  it('handles a plain prefix rule', () => {
    expect(matches('/collections/all', '/collections')).toBe(true);
    expect(matches('/products/x', '/collections')).toBe(false);
  });

  it('expands * wildcards anywhere in the pattern', () => {
    expect(matches('/a/filter+color', '/a/*filter*')).toBe(true);
    expect(matches('/collections/x?filter=1&filter=2', '/collections/*filter*&*filter*')).toBe(true);
  });

  it('does not throw on a leading-* pattern (the resinstoresurat regression)', () => {
    // Previously built an invalid regex `/^*.../` → "Nothing to repeat".
    expect(() => matches('/collections/all?filter&filter', '*/collections/*filter*&*filter*')).not.toThrow();
  });

  it('honours the $ end-anchor', () => {
    expect(matches('/page.php', '/*.php$')).toBe(true);
    expect(matches('/page.php?x=1', '/*.php$')).toBe(false);
  });
});
