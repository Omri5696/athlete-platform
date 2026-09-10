// Hand-written row shapes for the tables in supabase/migrations/.
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
  source: "manual" | "garmin";
  created_at: string;

  hrv: number | null;
  hrv_status: string | null;
  rhr: number | null;
  respiration: number | null;
  spo2_avg: number | null;
  spo2_min: number | null;

  sleep_hours: number | null;
  sleep_score: number | null;
  sleep_deep_min: number | null;
  sleep_light_min: number | null;
  sleep_rem_min: number | null;
  sleep_awake_min: number | null;
  bedtime: string | null;
  wake_time: string | null;

  body_battery: number | null;
  body_battery_high: number | null;
  body_battery_low: number | null;

  stress_avg: number | null;
  stress_high_min: number | null;
  rest_min: number | null;

  steps: number | null;
  active_min: number | null;
  intensity_min: number | null;
  calories: number | null;
  floors: number | null;

  load: number | null;
  atl: number | null;
  ctl: number | null;
  training_readiness: number | null;
  training_status: string | null;
  recovery_hours: number | null;
  vo2max: number | null;

  weight_kg: number | null;
}

export interface DailyCheckinRow {
  id: string;
  athlete_id: string;
  checkin_date: string;
  sleep_quality: number | null;
  energy: number | null;
  mood: number | null;
  soreness: number | null;
  stress: number | null;
  sleep_hours: number | null;
  weight_kg: number | null;
  ate: string | null;
  note: string | null;
  answers: Record<string, string> | null;
  created_at: string;
}

/** DailyMetricRow → DayMetrics (camelCase, per src/lib/types). */
export function metricRowToDay(r: DailyMetricRow): import("../types").DayMetrics {
  return {
    date: r.metric_date,
    hrv: r.hrv,
    hrvStatus: r.hrv_status,
    rhr: r.rhr,
    respiration: r.respiration,
    spo2Avg: r.spo2_avg,
    spo2Min: r.spo2_min,
    sleepHours: r.sleep_hours,
    sleepScore: r.sleep_score,
    sleepDeepMin: r.sleep_deep_min,
    sleepLightMin: r.sleep_light_min,
    sleepRemMin: r.sleep_rem_min,
    sleepAwakeMin: r.sleep_awake_min,
    bedtime: r.bedtime,
    wakeTime: r.wake_time,
    bodyBattery: r.body_battery,
    bodyBatteryHigh: r.body_battery_high,
    bodyBatteryLow: r.body_battery_low,
    stressAvg: r.stress_avg,
    stressHighMin: r.stress_high_min,
    restMin: r.rest_min,
    steps: r.steps,
    activeMin: r.active_min,
    intensityMin: r.intensity_min,
    calories: r.calories,
    floors: r.floors,
    load: r.load,
    atl: r.atl,
    ctl: r.ctl,
    trainingReadiness: r.training_readiness,
    trainingStatus: r.training_status,
    recoveryHours: r.recovery_hours,
    vo2max: r.vo2max,
    weightKg: r.weight_kg,
  };
}
