import { sourceColor } from '@/lib/source-color';

export function SourceBadge({
  source,
  name,
}: {
  source: string;
  name?: string;
}) {
  const c = sourceColor(source);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-2xs font-medium"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: c.dot }}
        aria-hidden
      />
      {name ?? source}
    </span>
  );
}
