export interface ScrapedProduct {
  externalId: string;
  url: string;
  title: string;
  brand?: string;
  sku?: string;
  category?: string;
  imageUrl?: string;
  currency?: string;
  price?: number;
  originalPrice?: number;
  availability?: string;
}

export interface ScrapeContext {
  getHtml(url: string): Promise<string>;
  getJson<T>(url: string): Promise<T>;
  // Browser path (Phase 7). Typed against playwright-core so `tsc` resolves the
  // Page type without forcing a Chromium download into every CI `pnpm install`;
  // the heavy `playwright` browsers are installed only when USE_BROWSER=true.
  getPage(): Promise<import('playwright-core').Page>;
  limit<T>(fn: () => Promise<T>): Promise<T>;
  log: (msg: string, meta?: unknown) => void;
}

export interface SourceAdapter {
  key: string;
  name: string;
  baseUrl: string;
  vertical: string;
  enabled: boolean;
  mode: 'http' | 'browser';
  scrape(ctx: ScrapeContext): Promise<ScrapedProduct[]>;
}
