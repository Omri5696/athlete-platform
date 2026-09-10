import type { Athlete } from "./types";
import {
  analyseReadiness,
  baseline,
  daysOutsideBand,
  latestOf,
  metricSeries,
  recentMean,
} from "./analysis";

export interface Flag {
  key: string;
  label: string;
  severity: "watch" | "risk";
}

const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

/**
 * Multi-day patterns worth the coach's attention — never single-day dips.
 * Layer 3 (the convergence rules) will grow out of this file.
 */
export function athleteFlags(a: Athlete): Flag[] {
  const flags: Flag[] = [];
  const d = a.days;

  // --- sleep: a stretch of short nights ---
  const sleepRecent = metricSeries(d, "sleepHours").slice(-5);
  if (sleepRecent.length >= 4) {
    const avg = mean(sleepRecent);
    const shortNights = sleepRecent.filter((h) => h < 6.5).length;
    if (avg < 6 || shortNights >= 4) {
      flags.push({
        key: "sleep-debt",
        label: "שבוע של שינה קצרה",
        severity: avg < 5.7 ? "risk" : "watch",
      });
    }
  }

  // --- HRV suppressed vs personal baseline for several days ---
  const hrvLow = daysOutsideBand(d, "hrv", { k: 5, worseWhen: "low" });
  if (hrvLow >= 3) {
    flags.push({
      key: "hrv-suppressed",
      label: "HRV נמוך כמה ימים",
      severity: hrvLow >= 4 ? "risk" : "watch",
    });
  }

  // --- resting HR drifting up ---
  const rhrB = baseline(d, "rhr", { window: 28, exclude: 3 });
  const rhrNow = recentMean(d, "rhr", 3);
  if (rhrB.n >= 7 && rhrNow != null && rhrNow - rhrB.mean >= 3) {
    flags.push({ key: "rhr-elevated", label: "דופק מנוחה מוגבה", severity: "watch" });
  }

  // --- all-day stress trending up ---
  const stressHigh = daysOutsideBand(d, "stressAvg", { k: 5, worseWhen: "high" });
  const stressNow = recentMean(d, "stressAvg", 3);
  if (stressHigh >= 3 && stressNow != null && stressNow >= 45) {
    flags.push({ key: "stress-high", label: "סטרס גבוה כמה ימים", severity: "watch" });
  }

  // --- respiration elevated (early-illness signal) ---
  const respHigh = daysOutsideBand(d, "respiration", { k: 3, sdMult: 1, worseWhen: "high" });
  if (respHigh >= 2) {
    flags.push({ key: "respiration-up", label: "קצב נשימה מוגבה", severity: "watch" });
  }

  // --- objective/subjective divergence ---
  const { coherenceGap } = analyseReadiness(a);
  if (coherenceGap != null && Math.abs(coherenceGap) >= 22) {
    flags.push({
      key: "coherence",
      label:
        coherenceGap > 0 ? "מרגיש טוב אבל המספרים נמוכים" : "המספרים תקינים אבל מרגיש רע",
      severity: "watch",
    });
  }

  // --- ACWR spike ---
  const atl = latestOf(d, "atl");
  const ctl = latestOf(d, "ctl");
  if (atl != null && ctl != null && ctl > 0) {
    const acwr = atl / ctl;
    if (acwr >= 1.5) {
      flags.push({ key: "acwr-spike", label: "קפיצת עומס חדה", severity: acwr >= 1.7 ? "risk" : "watch" });
    }
  }

  // --- no check-in ---
  if (!a.checkin.submitted) {
    flags.push({ key: "no-checkin", label: "אין צ׳ק-אין", severity: "watch" });
  }

  return flags;
}
