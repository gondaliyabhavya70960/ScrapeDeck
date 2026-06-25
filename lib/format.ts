/** Tiny classnames joiner (no dependency). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

const CURRENCY_SYMBOL: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/** Format a price with its currency symbol and grouped thousands. */
export function formatPrice(
  amount: number | null | undefined,
  currency = 'INR',
): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  const symbol = CURRENCY_SYMBOL[currency] ?? '';
  const body = amount.toLocaleString('en-IN', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return symbol ? `${symbol}${body}` : `${body} ${currency}`;
}

/** Signed percentage, e.g. +12.5% / −8%. */
export function formatPct(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return '—';
  const sign = pct > 0 ? '+' : pct < 0 ? '−' : '';
  const abs = Math.abs(pct);
  const body = abs.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  return `${sign}${body}%`;
}

/** Compact relative time: "just now", "3h ago", "2d ago", else a date. */
export function formatRelative(
  iso: string | null | undefined,
  now: number = Date.now(),
): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  const diff = now - t;
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return formatDate(iso);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  return new Date(t).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  return new Date(t).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

/** Human label for an availability code. */
export function availabilityLabel(a: string | null | undefined): string {
  switch (a) {
    case 'in_stock':
      return 'In stock';
    case 'out_of_stock':
      return 'Out of stock';
    case '':
    case null:
    case undefined:
      return 'Unknown';
    default:
      return a;
  }
}

/** Title-case a vertical key for display ("3dprint" → "3D-Print"). */
export function verticalLabel(v: string): string {
  if (v === '3dprint') return '3D-Print';
  if (v === 'resin') return 'Resin';
  return v.charAt(0).toUpperCase() + v.slice(1);
}
