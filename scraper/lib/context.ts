import type { ScrapeContext, SourceAdapter } from '../types';
import { getText, getJson } from './fetch';
import { createLimiter } from './politeness';

/**
 * Build an isolated ScrapeContext for one source. Each source gets its own
 * politeness limiter so a slow/large store can't starve the others, and a
 * prefixed logger. The browser path is lazily loaded so the default HTTP run
 * never imports Playwright.
 */
export function createContext(source: SourceAdapter): ScrapeContext {
  const limiter = createLimiter(2, 400);

  return {
    getHtml: (url) => getText(url),
    getJson: (url) => getJson(url),
    async getPage() {
      const { getBrowserPage } = await import('./browser');
      return getBrowserPage();
    },
    limit: (fn) => limiter(fn),
    log: (msg, meta) => {
      if (meta !== undefined) {
        console.log(`  ${msg}`, meta);
      } else {
        console.log(`  ${msg}`);
      }
    },
  };
}
