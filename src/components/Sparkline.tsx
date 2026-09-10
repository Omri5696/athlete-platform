interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  /** draw a smoothed (moving-average) line over the raw dots */
  smoothWindow?: number;
}

function movingAvg(values: number[], k: number): number[] {
  if (k <= 1) return values;
  return values.map((_, i) => {
    const lo = Math.max(0, i - k + 1);
    const slice = values.slice(lo, i + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
}

/**
 * Trend line. Faint area fill, 2px line, emphasised endpoint. Pure SVG, safe in
 * a server component. With `smoothWindow`, plots a moving-average line and keeps
 * the raw series only as a faint underlay.
 */
export function Sparkline({
  values,
  width = 120,
  height = 34,
  color = "var(--accent)",
  className = "spark",
  smoothWindow = 0,
}: SparklineProps) {
  if (values.length < 2) return null;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const x = (i: number) => pad + (i * (width - 2 * pad)) / (values.length - 1);
  const y = (v: number) => pad + (1 - (v - min) / range) * (height - 2 * pad);

  const path = (arr: number[]) =>
    arr
      .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
      .join(" ");

  const smoothed = smoothWindow > 1 ? movingAvg(values, smoothWindow) : values;
  const areaSrc = smoothed;
  const area =
    `M${x(0).toFixed(1)} ${height - pad} ` +
    areaSrc.map((v, i) => `L${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ") +
    ` L${x(areaSrc.length - 1).toFixed(1)} ${height - pad} Z`;
  const endV = smoothed[smoothed.length - 1];

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={area} fill={color} fillOpacity={0.1} />
      {smoothWindow > 1 && (
        <path
          d={path(values)}
          fill="none"
          stroke={color}
          strokeOpacity={0.28}
          strokeWidth={1}
        />
      )}
      <path
        d={path(smoothed)}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={x(smoothed.length - 1).toFixed(1)}
        cy={y(endV).toFixed(1)}
        r={3.2}
        fill={color}
        stroke="var(--panel)"
        strokeWidth={2}
      />
    </svg>
  );
}
