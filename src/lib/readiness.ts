import type { Athlete, Band } from "./types";

const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

/** Average of every day except today — the rolling baseline a metric is judged against. */
export const baseline = (a: number[]) => mean(a.slice(0, -1));

export const latest = <T>(a: T[]) => a[a.length - 1];

/**
 * Morning readiness score, 3–99. Draft formula — see docs/PLAN.md.
 * Blends HRV and resting-HR deviation from the 6-day baseline, last night's
 * sleep, and (when filled) the subjective check-in.
 */
export function readinessScore(a: Athlete): number {
  const hrvBase = baseline(a.hrv);
  const hrvDev = (latest(a.hrv) - hrvBase) / hrvBase;

  const rhrBase = baseline(a.rhr);
  const rhrDev = (latest(a.rhr) - rhrBase) / rhrBase;

  const sleep = latest(a.sleepHours);

  let s = 72 + hrvDev * 115 - rhrDev * 170 + (sleep - 7) * 7;

  if (a.checkin.submitted) {
    const c = a.checkin;
    s +=
      (c.energy - 3) * 3.5 +
      (3 - c.soreness) * 2.5 +
      (3 - c.stress) * 2.5 +
      (c.sleepQuality - 3) * 3;
  }

  return Math.max(3, Math.min(99, Math.round(s)));
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

export interface Delta {
  /** rounded change vs baseline; percentage points when `pct` */
  value: number;
  /** formatted for display, e.g. "+4", "−12%", "±0" */
  text: string;
  direction: "up" | "down" | "flat";
  /** true when the change is in the unwanted direction */
  bad: boolean;
}

/** Change of a metric's latest value vs its baseline. */
export function delta(
  series: number[],
  opts: { invert?: boolean; pct?: boolean; decimals?: number } = {},
): Delta {
  const { invert = false, pct = false, decimals = 0 } = opts;
  const b = baseline(series);
  const diff = latest(series) - b;
  const value = pct ? Math.round((diff / b) * 100) : Math.round(diff * 10) / 10;

  const threshold = pct ? 2 : decimals ? 0.15 : 0.5;
  if (Math.abs(value) < threshold) {
    return { value: 0, text: "±0", direction: "flat", bad: false };
  }

  const direction = diff > 0 ? "up" : "down";
  const improved = invert ? diff < 0 : diff > 0;
  const sign = diff > 0 ? "+" : "−";
  const magnitude = pct
    ? `${Math.abs(value)}%`
    : Math.abs(diff).toFixed(decimals);

  return { value, text: `${sign}${magnitude}`, direction, bad: !improved };
}
