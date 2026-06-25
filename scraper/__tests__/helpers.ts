import type { ScrapeContext } from '../types';

/** A minimal ScrapeContext that serves a fixture from getJson/getHtml. */
export function fakeContext(payload: unknown): ScrapeContext {
  return {
    getHtml: async () =>
      typeof payload === 'string' ? payload : JSON.stringify(payload),
    getJson: async <T>() => payload as T,
    getPage: async () => {
      throw new Error('browser not available in tests');
    },
    limit: (fn) => fn(),
    log: () => {},
  };
}
