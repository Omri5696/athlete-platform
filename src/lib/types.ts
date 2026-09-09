// Domain types. In phase 3 these will be backed by Supabase rows; for now the
// demo data in `demo-data.ts` conforms to them.

/** One athlete's daily subjective check-in. `submitted: false` = not filled yet today. */
export type Checkin =
  | { submitted: false }
  | {
      submitted: true;
      /** 1–5, higher is better */
      sleepQuality: number;
      /** 1–5, higher is better */
      energy: number;
      /** 1–5, higher is better */
      mood: number;
      /** 1–5, higher is worse */
      soreness: number;
      /** 1–5, higher is worse */
      stress: number;
      /** free text — what they ate yesterday */
      ate: string;
      /** free text — anything the coach should know */
      note: string;
    };

/**
 * Objective daily metrics, one value per day, oldest first, last entry = today.
 * In production these arrive from the wearable aggregator (Terra / Vital).
 */
export interface Athlete {
  id: string;
  name: string;
  /** short descriptor shown under the name, e.g. "מרתון · שבוע עומס" */
  focus: string;
  /** morning HRV in ms */
  hrv: number[];
  /** resting heart rate, bpm */
  rhr: number[];
  /** sleep duration in hours */
  sleepHours: number[];
  /** Garmin Body Battery on waking, 0–100 */
  bodyBattery: number[];
  /** Garmin sleep score, 0–100 */
  sleepScore: number[];
  /** daily training load (Garmin "TL") */
  load: number[];
  /** today's check-in */
  checkin: Checkin;
}

export type Band = "ready" | "watch" | "risk";
