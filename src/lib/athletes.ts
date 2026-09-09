import "server-only";
import { createAdminClient } from "./supabase/server";
import type { Athlete, Checkin } from "./types";
import type {
  AthleteRow,
  DailyCheckinRow,
  DailyMetricRow,
} from "./supabase/db-types";

const WINDOW_DAYS = 7;

/**
 * Until coach login exists there is exactly one coach. Grab their id.
 * When auth lands, this becomes `auth.uid()` and reads move to the RLS client.
 */
async function soleCoachId(db: ReturnType<typeof createAdminClient>) {
  const { data, error } = await db
    .from("coaches")
    .select("id")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

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
  // metrics arrive oldest-first; keep the last WINDOW_DAYS
  const recent = metrics.slice(-WINDOW_DAYS);
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

/** All active athletes for the coach, each with their recent metrics + latest check-in. */
export async function getRoster(): Promise<Athlete[]> {
  const db = createAdminClient();
  const coachId = await soleCoachId(db);
  if (!coachId) return [];

  const { data: athletes, error } = await db
    .from("athletes")
    .select("*")
    .eq("coach_id", coachId)
    .is("archived_at", null)
    .order("name")
    .returns<AthleteRow[]>();
  if (error) throw error;
  if (!athletes.length) return [];

  const ids = athletes.map((a) => a.id);

  const { data: metrics, error: mErr } = await db
    .from("daily_metrics")
    .select("*")
    .in("athlete_id", ids)
    .order("metric_date")
    .returns<DailyMetricRow[]>();
  if (mErr) throw mErr;

  const { data: checkins, error: cErr } = await db
    .from("daily_checkins")
    .select("*")
    .in("athlete_id", ids)
    .order("checkin_date", { ascending: false })
    .returns<DailyCheckinRow[]>();
  if (cErr) throw cErr;

  const metricsByAthlete = groupBy(metrics, (m) => m.athlete_id);
  const latestCheckin = new Map<string, DailyCheckinRow>();
  for (const c of checkins) {
    if (!latestCheckin.has(c.athlete_id)) latestCheckin.set(c.athlete_id, c);
  }

  return athletes.map((a) =>
    assemble(a, metricsByAthlete.get(a.id) ?? [], latestCheckin.get(a.id)),
  );
}

/** One athlete by id, or null. */
export async function getAthlete(id: string): Promise<Athlete | null> {
  const db = createAdminClient();

  const { data: row, error } = await db
    .from("athletes")
    .select("*")
    .eq("id", id)
    .maybeSingle<AthleteRow>();
  if (error) throw error;
  if (!row) return null;

  const { data: metrics, error: mErr } = await db
    .from("daily_metrics")
    .select("*")
    .eq("athlete_id", id)
    .order("metric_date")
    .returns<DailyMetricRow[]>();
  if (mErr) throw mErr;

  const { data: checkins, error: cErr } = await db
    .from("daily_checkins")
    .select("*")
    .eq("athlete_id", id)
    .order("checkin_date", { ascending: false })
    .limit(1)
    .returns<DailyCheckinRow[]>();
  if (cErr) throw cErr;

  return assemble(row, metrics, checkins[0]);
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
