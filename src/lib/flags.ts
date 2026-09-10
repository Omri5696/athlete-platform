import type { Athlete } from "./types";
import { baseline, latest } from "./readiness";

export interface Flag {
  key: string;
  label: string;
  severity: "watch" | "risk";
}

const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

/**
 * Multi-day patterns worth the coach's attention — not single-day dips.
 * Runs off the 7-day series already loaded for each athlete.
 */
export function athleteFlags(a: Athlete): Flag[] {
  const flags: Flag[] = [];

  // --- sleep: a stretch of short nights, not one bad night ---
  const sleep = a.sleepHours.filter((n) => n > 0);
  if (sleep.length >= 4) {
    const recent = sleep.slice(-5);
    const avg = mean(recent);
    const shortNights = recent.filter((h) => h < 6.5).length;
    if (avg < 6 || shortNights >= 4) {
      flags.push({
        key: "sleep-debt",
        label: "שבוע של שינה קצרה",
        severity: avg < 5.7 ? "risk" : "watch",
      });
    }
  }

  // --- HRV: suppressed vs the athlete's own baseline for several days ---
  const hrv = a.hrv.filter((n) => n > 0);
  if (hrv.length >= 5) {
    const base = baseline(hrv);
    const lowDays = hrv.slice(-4).filter((v) => v < base * 0.9).length;
    if (lowDays >= 3) {
      flags.push({
        key: "hrv-suppressed",
        label: "HRV נמוך כמה ימים",
        severity: lowDays >= 4 ? "risk" : "watch",
      });
    }
  }

  // --- resting HR drifting up ---
  const rhr = a.rhr.filter((n) => n > 0);
  if (rhr.length >= 5) {
    const base = baseline(rhr);
    if (latest(rhr) - base >= 4 && mean(rhr.slice(-3)) - base >= 3) {
      flags.push({
        key: "rhr-elevated",
        label: "דופק מנוחה מוגבה",
        severity: "watch",
      });
    }
  }

  // --- no check-in ---
  if (!a.checkin.submitted) {
    flags.push({ key: "no-checkin", label: "אין צ׳ק-אין", severity: "watch" });
  }

  return flags;
}
