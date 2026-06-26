import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getDashboardData, filterByVertical } from '@/lib/sheet-data';
import { formatPct } from '@/lib/format';
import type { Product, ChangeEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DAY_MS = 86_400_000;

function filterProducts(products: Product[], sp: URLSearchParams): Product[] {
  const q = (sp.get('q') ?? '').toLowerCase();
  const srcSet = new Set((sp.get('source') ?? '').split(',').filter(Boolean));
  const category = sp.get('category') ?? 'all';
  const status = sp.get('availability') ?? 'all';
  const changed = sp.get('changed') === '1';
  const now = Date.now();

  return products.filter((p) => {
    if (q) {
      const hay = `${p.title} ${p.shortTagline} ${p.category}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (srcSet.size && !srcSet.has(p.source)) return false;
    if (category !== 'all' && p.category !== category) return false;
    if (status !== 'all' && p.status !== status) return false;
    if (changed) {
      const t = Date.parse(p.lastChanged);
      if (Number.isNaN(t) || now - t > DAY_MS) return false;
    }
    return true;
  });
}

function productAoa(products: Product[]): (string | number)[][] {
  const header = [
    'Source',
    'Vertical',
    'Title',
    'Category',
    'Tagline',
    'Price min',
    'Price max',
    'Currency',
    'Status',
    'Materials',
    'Dimensions',
    'Change %',
    'URL',
    'First seen',
    'Last changed',
  ];
  const rows = products.map((p) => [
    p.source,
    p.vertical,
    p.title,
    p.category,
    p.shortTagline,
    p.priceMin ?? '',
    p.priceMax ?? '',
    p.currency,
    p.status,
    p.materials,
    p.dimensions,
    p.delta ? formatPct(p.delta.pct) : '',
    p.url,
    p.firstSeen,
    p.lastChanged,
  ]);
  return [header, ...rows];
}

function changesAoa(changes: ChangeEvent[]): (string | number)[][] {
  const header = [
    'Time',
    'Source',
    'Title',
    'Old price',
    'New price',
    'Change %',
    'Direction',
    'Old status',
    'New status',
    'URL',
  ];
  const rows = changes.map((c) => [
    c.timestamp,
    c.source,
    c.title,
    c.oldPrice ?? '',
    c.newPrice ?? '',
    c.pct != null ? formatPct(c.pct) : '',
    c.direction ?? '',
    c.oldStatus ?? '',
    c.newStatus ?? '',
    c.url,
  ]);
  return [header, ...rows];
}

export async function GET(request: Request) {
  const data = await getDashboardData();
  if (!data.ok) {
    return NextResponse.json(
      { error: 'Sheet unreachable', detail: data.error },
      { status: 502 },
    );
  }

  const sp = new URL(request.url).searchParams;
  const format = sp.get('format') === 'csv' ? 'csv' : 'xlsx';
  const tab = sp.get('tab') === 'changes' ? 'changes' : 'products';
  const vertical = sp.get('v') ?? 'all';
  const date = new Date().toISOString().slice(0, 10);

  const aoa =
    tab === 'changes'
      ? changesAoa(filterByVertical(data.changes, vertical))
      : productAoa(filterProducts(filterByVertical(data.products, vertical), sp));

  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const base = `scrapedeck-${tab}-${date}`;

  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return new NextResponse(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${base}.csv"`,
        'cache-control': 'no-store',
      },
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, tab === 'changes' ? 'Changes' : 'Products');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'content-type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="${base}.xlsx"`,
      'cache-control': 'no-store',
    },
  });
}
