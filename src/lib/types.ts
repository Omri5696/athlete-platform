// Domain types. Backed by Supabase; see supabase/migrations/.

export type Band = "ready" | "watch" | "risk";

/** One athlete's daily subjective check-in (today's, or the latest). */
export type Checkin =
  | { submitted: false }
  | {
      submitted: true;
      sleepQuality: number; // 1–5, higher better
      energy: number; // 1–5, higher better
      mood: number; // 1–5, higher better
      soreness: number; // 1–5, higher worse
      stress: number; // 1–5, higher worse
      ate: string;
      note: string;
      /** answers to custom questions, keyed by question.key */
      answers: Record<string, string>;
    };

/**
 * One day of objective metrics for an athlete. Every field nullable — a day may
 * only carry a few. `date` is YYYY-MM-DD. Sourced from the watch (manual entry
 * now, TrainingPeaks CSV later).
 */
export interface DayMetrics {
  date: string;

  // autonomic / recovery
  hrv: number | null; // overnight RMSSD, ms
  hrvStatus: string | null; // balanced | unbalanced | low | poor
  rhr: number | null; // bpm
  respiration: number | null; // nightly avg breaths/min
  spo2Avg: number | null; // %
  spo2Min: number | null;

  // sleep
  sleepHours: number | null;
  sleepScore: number | null; // 0–100
  sleepDeepMin: number | null;
  sleepLightMin: number | null;
  sleepRemMin: number | null;
  sleepAwakeMin: number | null;
  bedtime: string | null; // "HH:MM"
  wakeTime: string | null; // "HH:MM"

  // energy
  bodyBattery: number | null; // morning value
  bodyBatteryHigh: number | null;
  bodyBatteryLow: number | null;

  // stress
  stressAvg: number | null; // Garmin all-day stress 0–100
  stressHighMin: number | null;
  restMin: number | null;

  // activity
  steps: number | null;
  activeMin: number | null;
  intensityMin: number | null;
  calories: number | null;
  floors: number | null;

  // training
  load: number | null; // daily training load
  atl: number | null; // acute load (~7d)
  ctl: number | null; // chronic load (~42d)
  trainingReadiness: number | null; // Garmin's own 0–100
  trainingStatus: string | null;
  recoveryHours: number | null;
  vo2max: number | null;

  // body
  weightKg: number | null;
}

/** Numeric keys of DayMetrics — the metrics you can trend / baseline. */
export type MetricKey = {
  [K in keyof DayMetrics]: DayMetrics[K] extends number | null ? K : never;
}[keyof DayMetrics];

export interface Athlete {
  id: string;
  name: string;
  focus: string;
  /** daily metrics, oldest first — as many days as loaded (up to ~60 for baselines) */
  days: DayMetrics[];
  /** the latest check-in (usually today's) */
  checkin: Checkin;
}
