import "server-only";
import { createClient } from "./supabase/server";
import { requireCoach } from "./auth";
import type { Athlete, Checkin } from "./types";
import type {
  AthleteRow,
  DailyCheckinRow,
  DailyMetricRow,
} from "./supabase/db-types";

const WINDOW_DAYS = 7;

function checkinFromRow(row: DailyCheckinRow | undefined): Checkin {
  if (
    !row ||
    row.sleep_quality == null ||
    row.energy == null ||
    row.mood == null ||
    row.soreness == null ||
    row.stress == null
  ) {
    return { submitted: false };
  }
  return {
    submitted: true,
    sleepQuality: row.sleep_quality,
    energy: row.energy,
    mood: row.mood,
    soreness: row.soreness,
    stress: row.stress,
    ate: row.ate ?? "",
    note: row.note ?? "",
  };
}

/** DB rows -> the `Athlete` shape the UI components already consume. */
function assemble(
  row: AthleteRow,
  metrics: DailyMetricRow[],
  checkin: DailyCheckinRow | undefined,
): Athlete {
  const recent = metrics.slice(-WINDOW_DAYS); // metrics arrive oldest-first
  const num = (key: keyof DailyMetricRow) =>
    recent.map((m) => Number(m[key] ?? 0));

  return {
    id: row.id,
    name: row.name,
    focus: row.focus,
    hrv: num("hrv"),
    rhr: num("rhr"),
    sleepHours: num("sleep_hours"),
    bodyBattery: num("body_battery"),
    sleepScore: num("sleep_score"),
    load: num("load"),
    checkin: checkinFromRow(checkin),
  };
}

/** All active athletes for the signed-in coach, with recent metrics + latest check-in. */
export async function getRoster(): Promise<Athlete[]> {
  await requireCoach();
  const db = await createClient();

  const { data: athletes, error } = await db
    .from("athletes")
    .select("*")
    .is("archived_at", null)
    .order("name")
    .returns<AthleteRow[]>();
  if (error) throw error;
  if (!athletes.length) return [];

  const ids = athletes.map((a) => a.id);

  const [{ data: metrics, error: mErr }, { data: checkins, error: cErr }] =
    await Promise.all([
      db
        .from("daily_metrics")
        .select("*")
        .in("athlete_id", ids)
        .order("metric_date")
        .returns<DailyMetricRow[]>(),
      db
        .from("daily_checkins")
        .select("*")
        .in("athlete_id", ids)
        .order("checkin_date", { ascending: false })
        .returns<DailyCheckinRow[]>(),
    ]);
  if (mErr) throw mErr;
  if (cErr) throw cErr;

  const metricsByAthlete = groupBy(metrics ?? [], (m) => m.athlete_id);
  const latestCheckin = new Map<string, DailyCheckinRow>();
  for (const c of checkins ?? []) {
    if (!latestCheckin.has(c.athlete_id)) latestCheckin.set(c.athlete_id, c);
  }

  return athletes.map((a) =>
    assemble(a, metricsByAthlete.get(a.id) ?? [], latestCheckin.get(a.id)),
  );
}

export interface AthleteAdmin {
  id: string;
  name: string;
  focus: string;
  checkinToken: string;
  garminLinked: boolean;
  hasCheckinToday: boolean;
}

/** Athlete list for the management screen. */
export async function getManagedAthletes(): Promise<AthleteAdmin[]> {
  await requireCoach();
  const db = await createClient();

  const { data: athletes, error } = await db
    .from("athletes")
    .select("*")
    .is("archived_at", null)
    .order("name")
    .returns<AthleteRow[]>();
  if (error) throw error;
  if (!athletes.length) return [];

  const today = new Date().toISOString().slice(0, 10);
  const { data: todayCheckins } = await db
    .from("daily_checkins")
    .select("athlete_id")
    .eq("checkin_date", today)
    .in(
      "athlete_id",
      athletes.map((a) => a.id),
    );
  const submitted = new Set((todayCheckins ?? []).map((c) => c.athlete_id));

  return athletes.map((a) => ({
    id: a.id,
    name: a.name,
    focus: a.focus,
    checkinToken: a.checkin_token,
    garminLinked: a.garmin_linked,
    hasCheckinToday: submitted.has(a.id),
  }));
}

/** One athlete by id (own athletes only, enforced by RLS). */
export async function getAthlete(id: string): Promise<Athlete | null> {
  await requireCoach();
  const db = await createClient();

  const { data: row, error } = await db
    .from("athletes")
    .select("*")
    .eq("id", id)
    .maybeSingle<AthleteRow>();
  if (error) throw error;
  if (!row) return null;

  const [{ data: metrics, error: mErr }, { data: checkins, error: cErr }] =
    await Promise.all([
      db
        .from("daily_metrics")
        .select("*")
        .eq("athlete_id", id)
        .order("metric_date")
        .returns<DailyMetricRow[]>(),
      db
        .from("daily_checkins")
        .select("*")
        .eq("athlete_id", id)
        .order("checkin_date", { ascending: false })
        .limit(1)
        .returns<DailyCheckinRow[]>(),
    ]);
  if (mErr) throw mErr;
  if (cErr) throw cErr;

  return assemble(row, metrics ?? [], (checkins ?? [])[0]);
}

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = map.get(k);
    if (bucket) bucket.push(item);
    else map.set(k, [item]);
  }
  return map;
}
