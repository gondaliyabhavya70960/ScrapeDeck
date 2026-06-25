'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Activity,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { cn, formatRelative } from '@/lib/format';
import { VerticalSwitcher } from './VerticalSwitcher';

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/changes', label: 'Changes', icon: ArrowLeftRight },
  { href: '/runs', label: 'Runs', icon: Activity },
] as const;

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2 px-1">
      <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent text-sm font-bold text-white">
        S
      </span>
      <span className="text-[15px] font-bold tracking-tight text-ink">
        ScrapeDeck
      </span>
    </Link>
  );
}

function NavLinks({
  pathname,
  query,
  onNavigate,
}: {
  pathname: string;
  query: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={query ? `${href}?${query}` : href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-control px-2.5 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-accent/10 text-accent-ink'
                : 'text-muted hover:bg-surface-2 hover:text-ink',
            )}
          >
            <Icon size={17} className={active ? 'text-accent' : 'text-faint'} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Footer({
  lastSync,
  sheetUrl,
}: {
  lastSync: string | null;
  sheetUrl: string | null;
}) {
  return (
    <div className="mt-auto flex flex-col gap-2 border-t border-border px-1 pt-4 text-2xs text-muted">
      <span>
        Last synced{' '}
        <span className="font-medium text-ink">{formatRelative(lastSync)}</span>
      </span>
      {sheetUrl ? (
        <a
          href={sheetUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-accent hover:underline"
        >
          Open Google Sheet <ExternalLink size={12} />
        </a>
      ) : (
        <span className="text-faint">Sheet not configured</span>
      )}
    </div>
  );
}

/** Static rail shown while the interactive Sidebar (useSearchParams) streams in. */
export function SidebarFallback() {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col gap-6 border-r border-border bg-surface px-4 py-5 lg:flex">
        <Wordmark />
        <div className="h-9 rounded-control bg-surface-2" />
        <div className="flex flex-col gap-1">
          {NAV.map((n) => (
            <div key={n.href} className="h-9 rounded-control bg-surface-2/60" />
          ))}
        </div>
      </aside>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <Wordmark />
      </div>
    </>
  );
}

export function Sidebar({
  lastSync,
  sheetUrl,
}: {
  lastSync: string | null;
  sheetUrl: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col gap-6 border-r border-border bg-surface px-4 py-5 lg:flex">
        <Wordmark />
        <VerticalSwitcher />
        <NavLinks pathname={pathname} query={query} />
        <Footer lastSync={lastSync} sheetUrl={sheetUrl} />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
        <Wordmark />
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/30 animate-fade-in"
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col gap-6 border-r border-border bg-surface px-4 py-5 animate-slide-in">
            <div className="flex items-center justify-between">
              <Wordmark />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted"
              >
                <X size={18} />
              </button>
            </div>
            <VerticalSwitcher />
            <NavLinks
              pathname={pathname}
              query={query}
              onNavigate={() => setOpen(false)}
            />
            <Footer lastSync={lastSync} sheetUrl={sheetUrl} />
          </div>
        </div>
      ) : null}
    </>
  );
}
