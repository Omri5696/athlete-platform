import type { Athlete, Checkin, DayMetrics, MetricKey } from "./types";

/* ============================================================
   Layer 1 — per-metric baselines & deviations
   ============================================================ */

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

function sd(a: number[]): number {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
}

/** Non-null values of one metric, oldest first. */
export function metricSeries(days: DayMetrics[], key: MetricKey): number[] {
  return days.map((d) => d[key]).filter((v): v is number => v != null);
}

/** Same, but keeps the date — for charts / the timeline. */
export function datedSeries(
  days: DayMetrics[],
  key: MetricKey,
): { date: string; value: number }[] {
  return days
    .filter((d) => d[key] != null)
    .map((d) => ({ date: d.date, value: d[key] as number }));
}

export interface Baseline {
  mean: number;
  sd: number;
  n: number;
}

/**
 * Rolling baseline for a metric: mean + sd over the last `window` days,
 * excluding the most recent `exclude` days (so "today" isn't compared to itself).
 */
export function baseline(
  days: DayMetrics[],
  key: MetricKey,
  { window = 42, exclude = 1 }: { window?: number; exclude?: number } = {},
): Baseline {
  const scoped = exclude > 0 ? days.slice(0, -exclude) : days;
  const vals = metricSeries(scoped.slice(-window), key);
  return { mean: mean(vals), sd: sd(vals), n: vals.length };
}

export const latestOf = (days: DayMetrics[], key: MetricKey): number | null => {
  for (let i = days.length - 1; i >= 0; i--) {
    const v = days[i][key];
    if (v != null) return v;
  }
  return null;
};

/** Mean of the last `k` non-null values. */
export function recentMean(days: DayMetrics[], key: MetricKey, k: number): number | null {
  const s = metricSeries(days, key).slice(-k);
  return s.length ? mean(s) : null;
}

export interface Deviation {
  z: number | null; // standard deviations from baseline
  pct: number | null; // % from baseline
  abs: number | null; // raw difference
}

export function deviation(value: number | null, base: Baseline): Deviation {
  if (value == null || base.n < 5) return { z: null, pct: null, abs: null };
  const abs = value - base.mean;
  return {
    abs,
    pct: base.mean !== 0 ? abs / base.mean : null,
    z: base.sd > 0 ? abs / base.sd : null,
  };
}

/** Least-squares slope of the last `k` values, per day. */
export function slope(values: number[], k = 10): number | null {
  const s = values.slice(-k);
  if (s.length < 4) return null;
  const n = s.length;
  const xm = (n - 1) / 2;
  const ym = mean(s);
  let num = 0;
  let den = 0;
  s.forEach((y, x) => {
    num += (x - xm) * (y - ym);
    den += (x - xm) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

/**
 * Count of the last `k` days where the metric sits outside its baseline band
 * in the "unwanted" direction. `worseWhen: "high" | "low"`.
 */
export function daysOutsideBand(
  days: DayMetrics[],
  key: MetricKey,
  {
    k = 7,
    sdMult = 0.75,
    worseWhen,
  }: { k?: number; sdMult?: number; worseWhen: "high" | "low" },
): number {
  const base = baseline(days, key, { window: 42, exclude: k });
  if (base.n < 7 || base.sd === 0) return 0;
  const recent = days.slice(-k);
  let count = 0;
  for (const d of recent) {
    const v = d[key];
    if (v == null) continue;
    const z = (v - base.mean) / base.sd;
    if (worseWhen === "low" && z <= -sdMult) count++;
    if (worseWhen === "high" && z >= sdMult) count++;
  }
  return count;
}

/* ============================================================
   Layer 2 — domain scores (0–100, 50 ≈ this athlete's normal)
   ============================================================ */

interface Part {
  key: string;
  label: string;
  /** contribution to the 0..100 score, already weighted-ready as a 0..100 sub-value */
  value: number;
  weight: number;
  /** short human note, e.g. "−14% מהרגיל" */
  note?: string;
  dir?: "up" | "down";
}

export interface DomainScore {
  score: number | null;
  parts: Part[];
}

function combine(parts: Part[]): number | null {
  if (parts.length === 0) return null;
  const tw = parts.reduce((s, p) => s + p.weight, 0);
  return Math.round(
    clamp(parts.reduce((s, p) => s + p.value * p.weight, 0) / tw, 1, 99),
  );
}

const pctNote = (pct: number) =>
  `${pct > 0 ? "+" : "−"}${Math.abs(Math.round(pct * 100))}% מהרגיל`;

/** Autonomic + sleep recovery. Higher = better recovered. */
export function recoveryScore(days: DayMetrics[]): DomainScore {
  if (days.length === 0) return { score: null, parts: [] };
  const parts: Part[] = [];

  // neutral anchor: a metric sitting at the athlete's own baseline scores ~63
  const N = 63;

  const hrv = latestOf(days, "hrv");
  const hrvB = baseline(days, "hrv");
  if (hrv != null && hrvB.n >= 7 && hrvB.mean > 0) {
    // blend today with a 3-day mean so one noisy night doesn't dominate
    const hrv3 = recentMean(days, "hrv", 3) ?? hrv;
    const pct = (0.6 * hrv + 0.4 * hrv3 - hrvB.mean) / hrvB.mean;
    parts.push({
      key: "hrv",
      label: "HRV",
      value: clamp(N + pct * 160, 8, 96),
      weight: 0.35,
      note: pctNote(pct),
      dir: pct < 0 ? "down" : "up",
    });
  }

  const rhr = latestOf(days, "rhr");
  const rhrB = baseline(days, "rhr");
  if (rhr != null && rhrB.n >= 7 && rhrB.mean > 0) {
    const rhr3 = recentMean(days, "rhr", 3) ?? rhr;
    const pct = (0.6 * rhr + 0.4 * rhr3 - rhrB.mean) / rhrB.mean;
    parts.push({
      key: "rhr",
      label: "דופק מנוחה",
      value: clamp(N - pct * 350, 10, 90),
      weight: 0.2,
      note: pctNote(pct),
      dir: pct > 0 ? "up" : "down",
    });
  }

  const sScore = latestOf(days, "sleepScore");
  const sHours = latestOf(days, "sleepHours");
  if (sScore != null) {
    parts.push({
      key: "sleep",
      label: "שינה",
      value: clamp(sScore, 5, 98),
      weight: 0.25,
      note: `ציון ${Math.round(sScore)}`,
      dir: sScore < 65 ? "down" : "up",
    });
  } else if (sHours != null) {
    parts.push({
      key: "sleep",
      label: "שינה",
      value: clamp(N + (sHours - 7.5) * 16, 5, 95),
      weight: 0.25,
      note: `${sHours.toFixed(1)} שעות`,
      dir: sHours < 6.8 ? "down" : "up",
    });
  }

  const resp = latestOf(days, "respiration");
  const respB = baseline(days, "respiration");
  if (resp != null && respB.n >= 7 && respB.sd > 0) {
    const z = (resp - respB.mean) / respB.sd;
    parts.push({
      key: "respiration",
      label: "קצב נשימה",
      value: clamp(N - z * 13, 25, 74),
      weight: 0.1,
      note: z > 0.7 ? "מוגבה" : "רגיל",
      dir: z > 0 ? "up" : "down",
    });
  }

  const bb = latestOf(days, "bodyBattery");
  const bbB = baseline(days, "bodyBattery");
  if (bb != null && bbB.n >= 7) {
    const d = bb - bbB.mean;
    parts.push({
      key: "bodyBattery",
      label: "Body Battery",
      value: clamp(N + d * 0.85, 12, 92),
      weight: 0.1,
      note: `${Math.round(bb)}`,
      dir: d < 0 ? "down" : "up",
    });
  }

  return { score: combine(parts), parts };
}

/** Strain / accumulated load. Higher = more loaded (≈50 balanced, high = risk). */
export function loadScore(days: DayMetrics[]): DomainScore {
  if (days.length === 0) return { score: null, parts: [] };
  const parts: Part[] = [];

  const atl = latestOf(days, "atl");
  const ctl = latestOf(days, "ctl");
  if (atl != null && ctl != null && ctl > 0) {
    const acwr = atl / ctl;
    parts.push({
      key: "acwr",
      label: "יחס עומס (ACWR)",
      value: clamp(50 + (acwr - 1) * 75, 0, 100),
      weight: 0.45,
      note: acwr.toFixed(2),
      dir: acwr > 1.2 ? "up" : acwr < 0.8 ? "down" : undefined,
    });
  }

  const load = latestOf(days, "load");
  const loadB = baseline(days, "load", { window: 28 });
  if (load != null && loadB.mean > 0) {
    const ratio = load / loadB.mean;
    parts.push({
      key: "load",
      label: "עומס היום",
      value: clamp(50 + (ratio - 1) * 45, 0, 100),
      weight: 0.2,
      note: pctNote(ratio - 1),
    });
  }

  const stress = latestOf(days, "stressAvg");
  const stressB = baseline(days, "stressAvg");
  if (stress != null) {
    const drift = stressB.n >= 7 ? stress - stressB.mean : 0;
    parts.push({
      key: "stress",
      label: "סטרס יומי",
      value: clamp(stress + drift, 0, 100),
      weight: 0.2,
      note: `${Math.round(stress)}`,
      dir: drift > 6 ? "up" : undefined,
    });
  }

  const steps = latestOf(days, "steps");
  const stepsB = baseline(days, "steps");
  if (steps != null && stepsB.mean > 0) {
    const ratio = steps / stepsB.mean;
    parts.push({
      key: "steps",
      label: "צעדים",
      value: clamp(50 + (ratio - 1) * 40, 10, 90),
      weight: 0.15,
    });
  }

  return { score: combine(parts), parts };
}

/** How the athlete says they feel. Higher = better. */
export function subjectiveScore(checkin: Checkin): number | null {
  if (!checkin.submitted) return null;
  const good = mean([checkin.energy, checkin.sleepQuality, checkin.mood]); // 1..5
  const bad = mean([checkin.soreness, checkin.stress]); // 1..5, higher worse
  const gPart = ((good - 1) / 4) * 100;
  const bPart = ((5 - bad) / 4) * 100;
  return Math.round(clamp(0.6 * gPart + 0.4 * bPart, 1, 99));
}

/* ============================================================
   Readiness — rebuilt on the domain scores
   ============================================================ */

export interface ReadinessBreakdown {
  readiness: number;
  recovery: number | null;
  load: number | null;
  subjective: number | null;
  /** recovery − subjective. + = numbers better than feel; − = feel better than numbers */
  coherenceGap: number | null;
  /** biggest things pushing readiness away from normal */
  drivers: { label: string; dir: "up" | "down"; note?: string }[];
}

export function analyseReadiness(athlete: Athlete): ReadinessBreakdown {
  const rec = recoveryScore(athlete.days);
  const load = loadScore(athlete.days);
  const sub = subjectiveScore(athlete.checkin);

  // base readiness from how recovered they are + how they feel
  const baseParts: [number, number][] = [];
  if (rec.score != null) baseParts.push([rec.score, 0.62]);
  if (sub != null) baseParts.push([sub, 0.38]);
  const base =
    baseParts.length === 0
      ? 55
      : baseParts.reduce((s, [v, w]) => s + v * w, 0) /
        baseParts.reduce((s, [, w]) => s + w, 0);

  // load only ever *reduces* readiness — high accumulated strain
  const loadPenalty = load.score != null ? Math.max(0, load.score - 62) * 0.8 : 0;

  const readiness = clamp(Math.round(base - loadPenalty), 3, 99);

  const drivers = [...rec.parts, ...load.parts]
    .filter((p) => Math.abs(p.value - 50) >= 12 && p.dir)
    .sort((a, b) => Math.abs(b.value - 50) - Math.abs(a.value - 50))
    .slice(0, 3)
    .map((p) => ({
      label: p.label,
      dir: p.dir as "up" | "down",
      note: p.note,
    }));

  return {
    readiness,
    recovery: rec.score,
    load: load.score,
    subjective: sub,
    coherenceGap:
      rec.score != null && sub != null ? Math.round(rec.score - sub) : null,
    drivers,
  };
}
