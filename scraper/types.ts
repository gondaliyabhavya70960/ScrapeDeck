export interface ScrapedProduct {
  // identity / bookkeeping
  externalId: string; // stable per-source id (Shopify/Woo numeric product id)
  url: string;
  sourceKey?: string; // set by the orchestrator
  vertical?: string; // set from the adapter
  currency?: string;

  // the requested 20 fields
  title: string;
  slug: string;
  category?: string;
  shortTagline?: string;
  description?: string; // plain text (HTML stripped)
  priceMin?: number;
  priceMax?: number;
  showPrice?: boolean;
  timeline?: string;
  materials?: string;
  dimensions?: string;
  status?: string; // active | out_of_stock
  featured?: boolean;
  images?: string[]; // URLs (do NOT rehost — reference only)
  imageAlts?: string[];
  fields?: Record<string, string>; // platform metadata / attributes
  seoTitle?: string; // filled by enrichment pass
  seoDescription?: string; // filled by enrichment pass
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
