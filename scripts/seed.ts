/**
 * Seed the database with the demo cohort so the app has real rows to read
 * before Garmin and manual entry exist. Idempotent: wipes this coach's
 * athletes and re-inserts.
 *
 *   set -a && . ./.env.local && set +a && npx tsx scripts/seed.ts
 */
import { createClient } from "@supabase/supabase-js";
import { DEMO_ATHLETES } from "../src/lib/demo-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COACH_EMAIL = "omricohen5696@gmail.com";
const COACH_NAME = "עומרי כהן";
/** last day in the demo series = "today" */
const TODAY = "2026-09-09";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** YYYY-MM-DD for `daysAgo` before TODAY */
function dateNDaysAgo(daysAgo: number): string {
  const d = new Date(`${TODAY}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function ensureCoach(): Promise<string> {
  const { data: list, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  let user = list.users.find((u) => u.email === COACH_EMAIL);

  if (!user) {
    const { data, error: createErr } = await db.auth.admin.createUser({
      email: COACH_EMAIL,
      email_confirm: true,
    });
    if (createErr) throw createErr;
    user = data.user;
    console.log(`created auth user for ${COACH_EMAIL}`);
  } else {
    console.log(`auth user for ${COACH_EMAIL} already exists`);
  }

  const { error: coachErr } = await db
    .from("coaches")
    .upsert({ id: user.id, name: COACH_NAME }, { onConflict: "id" });
  if (coachErr) throw coachErr;

  return user.id;
}

async function seed() {
  const coachId = await ensureCoach();

  const { error: delErr } = await db
    .from("athletes")
    .delete()
    .eq("coach_id", coachId);
  if (delErr) throw delErr;

  for (const a of DEMO_ATHLETES) {
    const { data: inserted, error: aErr } = await db
      .from("athletes")
      .insert({ coach_id: coachId, name: a.name, focus: a.focus })
      .select("id")
      .single();
    if (aErr) throw aErr;
    const athleteId = inserted.id;

    const metrics = a.hrv.map((_, i) => ({
      athlete_id: athleteId,
      metric_date: dateNDaysAgo(a.hrv.length - 1 - i),
      hrv: a.hrv[i],
      rhr: a.rhr[i],
      sleep_hours: a.sleepHours[i],
      body_battery: a.bodyBattery[i],
      sleep_score: a.sleepScore[i],
      load: a.load[i],
      source: "manual" as const,
    }));
    const { error: mErr } = await db.from("daily_metrics").insert(metrics);
    if (mErr) throw mErr;

    if (a.checkin.submitted) {
      const c = a.checkin;
      const { error: cErr } = await db.from("daily_checkins").insert({
        athlete_id: athleteId,
        checkin_date: TODAY,
        sleep_quality: c.sleepQuality,
        energy: c.energy,
        mood: c.mood,
        soreness: c.soreness,
        stress: c.stress,
        sleep_hours: a.sleepHours[a.sleepHours.length - 1],
        ate: c.ate,
        note: c.note,
      });
      if (cErr) throw cErr;
    }

    console.log(`  seeded ${a.name}`);
  }

  console.log(`\nDone — ${DEMO_ATHLETES.length} athletes under coach ${coachId}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
