import type { Athlete, Band } from "./types";
import { analyseReadiness, baseline, latestOf } from "./analysis";
import { metricSeries } from "./analysis";
import type { DayMetrics, MetricKey } from "./types";

/** Readiness score 3–99, built from the domain scores (see analysis.ts). */
export function readinessScore(a: Athlete): number {
  return analyseReadiness(a).readiness;
}

export function band(
  score: number,
  thresholds: { greenAt: number; amberAt: number } = { greenAt: 70, amberAt: 50 },
): Band {
  if (score >= thresholds.greenAt) return "ready";
  if (score >= thresholds.amberAt) return "watch";
  return "risk";
}

export const bandLabel: Record<Band, string> = {
  ready: "מוכן",
  watch: "במעקב",
  risk: "בסיכון",
};

/* ---- small helpers still used by the dashboard / detail ---- */

export const latest = latestOf;

export interface Delta {
  text: string;
  direction: "up" | "down" | "flat";
  bad: boolean;
}

/**
 * A metric's latest value vs its rolling baseline (not vs "7 days ago").
 * `invert` — a rise is the unwanted direction (e.g. resting HR).
 */
export function metricDelta(
  days: DayMetrics[],
  key: MetricKey,
  { invert = false, pct = false, decimals = 0 }: { invert?: boolean; pct?: boolean; decimals?: number } = {},
): Delta {
  const value = latestOf(days, key);
  const base = baseline(days, key, { window: 28 });
  if (value == null || base.n < 5 || base.mean === 0) {
    return { text: "±0", direction: "flat", bad: false };
  }
  const abs = value - base.mean;
  const shown = pct ? Math.round((abs / base.mean) * 100) : Math.round(abs * 10 ** decimals) / 10 ** decimals;
  const threshold = pct ? 2 : decimals ? 0.15 : 0.5;
  if (Math.abs(shown) < threshold) return { text: "±0", direction: "flat", bad: false };

  const direction = abs > 0 ? "up" : "down";
  const improved = invert ? abs < 0 : abs > 0;
  const sign = abs > 0 ? "+" : "−";
  const mag = pct ? `${Math.abs(shown)}%` : Math.abs(abs).toFixed(decimals);
  return { text: `${sign}${mag}`, direction, bad: !improved };
}

/** Back-compat: plain number[] delta (kept for any remaining callers). */
export function delta(
  series: number[],
  { invert = false, pct = false, decimals = 0 }: { invert?: boolean; pct?: boolean; decimals?: number } = {},
): Delta {
  if (series.length < 2) return { text: "±0", direction: "flat", bad: false };
  const base = series.slice(0, -1).reduce((s, v) => s + v, 0) / (series.length - 1);
  const value = series[series.length - 1];
  const abs = value - base;
  const shown = pct ? Math.round((abs / base) * 100) : Math.round(abs * 10 ** decimals) / 10 ** decimals;
  const threshold = pct ? 2 : decimals ? 0.15 : 0.5;
  if (Math.abs(shown) < threshold) return { text: "±0", direction: "flat", bad: false };
  const direction = abs > 0 ? "up" : "down";
  const improved = invert ? abs < 0 : abs > 0;
  const sign = abs > 0 ? "+" : "−";
  const mag = pct ? `${Math.abs(shown)}%` : Math.abs(abs).toFixed(decimals);
  return { text: `${sign}${mag}`, direction, bad: !improved };
}

export { metricSeries };
