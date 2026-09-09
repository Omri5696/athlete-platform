interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  /** CSS color (defaults to the accent token) */
  color?: string;
  className?: string;
}

/**
 * Minimal 7-day trend line: faint area fill, 2px line, emphasised endpoint
 * with a surface-colored ring. Pure SVG, safe in a server component.
 */
export function Sparkline({
  values,
  width = 120,
  height = 34,
  color = "var(--accent)",
  className = "spark",
}: SparklineProps) {
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const x = (i: number) => pad + (i * (width - 2 * pad)) / (values.length - 1);
  const y = (v: number) => pad + (1 - (v - min) / range) * (height - 2 * pad);

  const pts = values.map((v, i) => [x(i), y(v)] as const);
  const line = pts
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area =
    `M${pts[0][0].toFixed(1)} ${height - pad} ` +
    pts.map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") +
    ` L${pts[pts.length - 1][0].toFixed(1)} ${height - pad} Z`;
  const end = pts[pts.length - 1];

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={area} fill={color} fillOpacity={0.12} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={end[0].toFixed(1)}
        cy={end[1].toFixed(1)}
        r={3.4}
        fill={color}
        stroke="var(--surface)"
        strokeWidth={2}
      />
    </svg>
  );
}
