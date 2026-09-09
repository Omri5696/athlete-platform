// Hand-written row shapes for the tables in supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types` once the CLI is wired up.

export interface AthleteRow {
  id: string;
  coach_id: string;
  name: string;
  focus: string;
  checkin_token: string;
  garmin_linked: boolean;
  created_at: string;
  archived_at: string | null;
}

export interface DailyMetricRow {
  id: string;
  athlete_id: string;
  metric_date: string; // YYYY-MM-DD
  hrv: number | null;
  rhr: number | null;
  sleep_hours: number | null;
  body_battery: number | null;
  sleep_score: number | null;
  load: number | null;
  source: "manual" | "garmin";
  created_at: string;
}

export interface DailyCheckinRow {
  id: string;
  athlete_id: string;
  checkin_date: string; // YYYY-MM-DD
  sleep_quality: number | null;
  energy: number | null;
  mood: number | null;
  soreness: number | null;
  stress: number | null;
  sleep_hours: number | null;
  weight_kg: number | null;
  ate: string | null;
  note: string | null;
  created_at: string;
}
