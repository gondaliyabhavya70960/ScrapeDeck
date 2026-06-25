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
  source: string;
  vertical: string;
  externalId: string;
  title: string;
  brand: string;
  sku: string;
  category: string;
  currency: string;
  price: number | null;
  originalPrice: number | null;
  availability: string;
  imageUrl: string;
  url: string;
  firstSeen: string;
  lastSeen: string;
  lastChanged: string;
  contentHash: string;
  /** Price movement since the previous recorded change, if any. */
  delta: PriceDelta | null;
}

export interface HistoryPoint {
  timestamp: string;
  source: string;
  externalId: string;
  title: string;
  currency: string;
  price: number | null;
  originalPrice: number | null;
  availability: string;
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
  oldAvailability: string | null;
  newAvailability: string | null;
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
