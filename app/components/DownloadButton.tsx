import { Download } from 'lucide-react';

/**
 * Device-copy download. Uses a native <details> menu so it needs no client JS
 * and stays keyboard-accessible. The API route sets Content-Disposition, so the
 * links download directly. `query` carries the active filters (vertical, etc.).
 */
export function DownloadButton({ query = '' }: { query?: string }) {
  const href = (format: 'xlsx' | 'csv') =>
    `/api/export?format=${format}${query ? `&${query}` : ''}`;

  return (
    <details className="group relative">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-control border border-border bg-surface px-3 text-xs font-medium text-ink transition-colors hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <Download size={15} className="text-muted" />
        Download
      </summary>
      <div className="absolute right-0 z-20 mt-1.5 w-36 overflow-hidden rounded-control border border-border bg-surface py-1 shadow-raised animate-fade-in">
        <a
          href={href('xlsx')}
          download
          className="block px-3 py-1.5 text-xs text-ink hover:bg-surface-2"
        >
          Excel (.xlsx)
        </a>
        <a
          href={href('csv')}
          download
          className="block px-3 py-1.5 text-xs text-ink hover:bg-surface-2"
        >
          CSV (.csv)
        </a>
      </div>
    </details>
  );
}
