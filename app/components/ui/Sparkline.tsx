/**
 * Dependency-free sparkline (pure SVG, render-anywhere). recharts is reserved
 * for the larger, interactive price-history chart in the product drawer.
 */
export function Sparkline({
  values,
  width = 96,
  height = 28,
  strokeWidth = 1.5,
}: {
  values: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
}) {
  const pts = values.filter((v) => Number.isFinite(v));
  if (pts.length < 2) {
    return (
      <svg width={width} height={height} aria-hidden>
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          strokeDasharray="2 3"
        />
      </svg>
    );
  }

  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const pad = strokeWidth + 1;
  const stepX = (width - pad * 2) / (pts.length - 1);
  const coords = pts.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = coords
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  const last = pts[pts.length - 1]!;
  const first = pts[0]!;
  const color = last >= first ? 'var(--up)' : 'var(--down)';
  const area = `${line} L${coords[coords.length - 1]![0].toFixed(1)} ${
    height - pad
  } L${coords[0]![0].toFixed(1)} ${height - pad} Z`;

  return (
    <svg width={width} height={height} aria-hidden className="overflow-visible">
      <path d={area} fill={color} opacity={0.08} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={coords[coords.length - 1]![0]}
        cy={coords[coords.length - 1]![1]}
        r={1.8}
        fill={color}
      />
    </svg>
  );
}
