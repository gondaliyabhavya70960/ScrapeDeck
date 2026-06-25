'use client';

import { useState } from 'react';
import { cn } from '@/lib/format';

/** Product thumbnail with a graceful initials fallback for broken store CDNs. */
export function Thumbnail({
  src,
  alt,
  size = 40,
  className,
}: {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImg = src && !failed;
  const initial = (alt?.trim()?.[0] ?? '?').toUpperCase();

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-control border border-border bg-surface-2',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-xs font-semibold text-faint">{initial}</span>
      )}
    </div>
  );
}
