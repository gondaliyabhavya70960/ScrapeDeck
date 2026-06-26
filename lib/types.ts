export interface PriceDelta {
  direction: 'up' | 'down';
  /** Signed absolute change: new − previous. */
  amount: number;
  /** Signed percentage change. */
  pct: number;
  previous: number;
}

export interface Product {
  key: string; // `${source}|${externalId}`
  source: string; // the source key
  vertical: string;
  externalId: string;
  title: string;
  slug: string;
  category: string;
  shortTagline: string;
  description: string;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  showPrice: boolean;
  timeline: string;
  materials: string;
  dimensions: string;
  status: string; // active | out_of_stock
  featured: boolean;
  images: string[];
  imageAlts: string[];
  fields: Record<string, string>;
  seoTitle: string;
  seoDescription: string;
  url: string;
  firstSeen: string;
  lastSeen: string;
  lastChanged: string;
  contentHash: string;
  /** Movement on priceMin since the previous recorded change, if any. */
  delta: PriceDelta | null;
}

export interface HistoryPoint {
  timestamp: string;
  source: string;
  externalId: string;
  title: string;
  currency: string;
  priceMin: number | null;
  priceMax: number | null;
  status: string;
}

export type RunStatus = 'ok' | 'partial' | 'failed';

export interface Run {
  timestamp: string;
  source: string;
  status: RunStatus;
  found: number;
  new: number;
  changed: number;
  durationMs: number;
  error: string;
}

export interface ChangeEvent {
  id: string;
  timestamp: string;
  key: string;
  source: string;
  vertical: string;
  externalId: string;
  title: string;
  imageUrl: string;
  url: string;
  currency: string;
  oldPrice: number | null;
  newPrice: number | null;
  pct: number | null;
  direction: 'up' | 'down' | null;
  oldStatus: string | null;
  newStatus: string | null;
}

export interface DashboardData {
  products: Product[];
  history: HistoryPoint[];
  runs: Run[];
  changes: ChangeEvent[];
  sources: string[];
  verticals: string[];
  lastSync: string | null;
  sheetUrl: string | null;
}

export type LoadResult =
  | ({ ok: true } & DashboardData)
  | { ok: false; error: string };
