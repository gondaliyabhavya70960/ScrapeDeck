'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/format';

const OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'resin', label: 'Resin' },
  { value: '3dprint', label: '3D-Print' },
] as const;

/** Segmented control pinned in the sidebar; persists as the `?v=` URL param so
 * every server view filters consistently. */
export function VerticalSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('v') ?? 'all';

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete('v');
    else params.set('v', value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div
      role="tablist"
      aria-label="Vertical"
      className="grid grid-cols-3 gap-0.5 rounded-control bg-surface-2 p-0.5"
    >
      {OPTIONS.map((opt) => {
        const active = current === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => select(opt.value)}
            className={cn(
              'rounded-[6px] px-2 py-1.5 text-2xs font-medium transition-colors',
              active
                ? 'bg-surface text-ink shadow-sm'
                : 'text-muted hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
