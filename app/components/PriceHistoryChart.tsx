'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatPrice } from '@/lib/format';

export interface PricePoint {
  t: string;
  price: number | null;
  availability: string;
}

export function PriceHistoryChart({
  data,
  currency,
}: {
  data: PricePoint[];
  currency: string;
}) {
  const points = data
    .filter((d) => d.price != null)
    .map((d) => ({ t: d.t, price: d.price as number }));

  if (points.length < 2) {
    return (
      <div className="flex h-44 items-center justify-center rounded-control border border-dashed border-border text-xs text-faint">
        Not enough history yet — a chart appears after the first price change.
      </div>
    );
  }

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 6, right: 6, bottom: 0, left: 6 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="t"
            tickFormatter={(t: string) =>
              new Date(t).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })
            }
            tick={{ fontSize: 11, fill: 'var(--faint)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            minTickGap={28}
          />
          <YAxis
            width={56}
            tick={{ fontSize: 11, fill: 'var(--faint)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatPrice(v, currency)}
            domain={['auto', 'auto']}
          />
          <Tooltip
            cursor={{ stroke: 'var(--border)' }}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid var(--border)',
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
              boxShadow: '0 4px 16px -4px rgba(16,24,40,0.12)',
            }}
            labelFormatter={(t) =>
              new Date(t as string).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            }
            formatter={(v: number) => [formatPrice(v, currency), 'Price']}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#priceFill)"
            dot={false}
            activeDot={{ r: 3.5, fill: 'var(--accent)' }}
            animationDuration={400}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
