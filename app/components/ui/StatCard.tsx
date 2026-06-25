import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'default',
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'up' | 'down' | 'warn';
  className?: string;
}) {
  const toneText =
    tone === 'up'
      ? 'text-up'
      : tone === 'down'
        ? 'text-down'
        : tone === 'warn'
          ? 'text-warn'
          : 'text-ink';
  return (
    <div className={cn('card card-raised p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
        {icon ? <span className="text-faint">{icon}</span> : null}
      </div>
      <p
        className={cn(
          'tabular mt-2 text-2xl font-semibold leading-none sm:text-[34px]',
          toneText,
        )}
      >
        {value}
      </p>
      {sub ? <div className="mt-2 text-xs text-muted">{sub}</div> : null}
    </div>
  );
}
