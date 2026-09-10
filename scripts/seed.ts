/**
 * Seed the DB with the demo cohort: a coach auth user, 10 athletes, ~56 days of
 * daily_metrics per athlete (generated from their "story" in demo-data.ts), and
 * today's check-ins. Idempotent — wipes this coach's athletes and re-inserts.
 *
 *   set -a && . ./.env.local && set +a && npx tsx scripts/seed.ts
 */
import { createClient } from "@supabase/supabase-js";
import { DEMO_PROFILES, type DemoProfile } from "../src/lib/demo-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COACH_EMAIL = "omricohen5696@gmail.com";
const COACH_NAME = "עומרי כהן";
const DAYS = 56;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** deterministic 0..1 from a string seed */
function rand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  return ((h >>> 0) % 100000) / 100000;
}
const jitter = (seed: string, amp: number) => (rand(seed) - 0.5) * 2 * amp;

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const round = (n: number, dp = 0) => Math.round(n * 10 ** dp) / 10 ** dp;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function dayRow(p: DemoProfile, athleteId: string, daysAgo: number) {
  const s = p.story(daysAgo);
  const b = p.base;
  const sd = (m: string) => `${p.id}-${daysAgo}-${m}`;

  const hrv = round(b.hrv * (s.hrvMul ?? 1) + jitter(sd("hrv"), 3.5), 0);
  const rhr = round(b.rhr + (s.rhrAdd ?? 0) + jitter(sd("rhr"), 2), 0);
  const sleepHours = round(clamp(b.sleepHours + (s.sleepAdd ?? 0) + jitter(sd("sl"), 0.5), 3.5, 9.5), 2);
  const sleepScore = round(clamp(b.sleepScore + (s.sleepScoreAdd ?? 0) + jitter(sd("ss"), 6), 20, 99), 0);
  const bb = round(clamp(b.bodyBattery + (s.bbAdd ?? 0) + jitter(sd("bb"), 8), 5, 100), 0);
  const stress = round(clamp(b.stressAvg + (s.stressAdd ?? 0) + jitter(sd("st"), 6), 8, 95), 0);
  const resp = round(b.respiration + (s.respAdd ?? 0) + jitter(sd("rp"), 0.6), 1);
  const spo2 = round(clamp(b.spo2 + (s.spo2Add ?? 0) + jitter(sd("sp"), 0.8), 88, 100), 0);
  const steps = round((b.steps * (s.stepsMul ?? 1) + jitter(sd("stp"), 1800)) / 100) * 100;
  const load = round(clamp(b.load * (s.loadMul ?? 1) + jitter(sd("ld"), 12), 0, 200), 0);
  const weight = round(b.weightKg + jitter(sd("wt"), 0.6), 1);

  // sleep stages ~ proportions of total
  const totalMin = Math.round(sleepHours * 60);
  const deep = Math.round(totalMin * (0.16 + jitter(sd("dp"), 0.03)));
  const rem = Math.round(totalMin * (0.21 + jitter(sd("rm"), 0.03)));
  const awake = Math.round(totalMin * (0.06 + Math.abs(jitter(sd("aw"), 0.03))));
  const light = totalMin - deep - rem - awake;

  return {
    athlete_id: athleteId,
    metric_date: dateNDaysAgo(daysAgo),
    source: "manual" as const,
    hrv,
    rhr,
    respiration: resp,
    spo2_avg: spo2,
    spo2_min: round(spo2 - 3 - Math.abs(jitter(sd("spm"), 2)), 0),
    sleep_hours: sleepHours,
    sleep_score: sleepScore,
    sleep_deep_min: deep,
    sleep_light_min: light,
    sleep_rem_min: rem,
    sleep_awake_min: awake,
    body_battery: bb,
    body_battery_high: round(clamp(bb + 15 + jitter(sd("bh"), 8), 20, 100), 0),
    body_battery_low: round(clamp(bb - 30 + jitter(sd("bl"), 8), 3, 60), 0),
    stress_avg: stress,
    stress_high_min: round(clamp(stress * 3 + jitter(sd("sh"), 30), 0, 400), 0),
    rest_min: round(clamp(400 - stress * 3 + jitter(sd("rst"), 40), 60, 700), 0),
    steps,
    active_min: round(clamp(load * 0.9 + jitter(sd("am"), 15), 0, 200), 0),
    intensity_min: round(clamp(load * 0.7 + jitter(sd("im"), 12), 0, 180), 0),
    calories: round((2100 + steps * 0.04 + load * 4 + jitter(sd("cal"), 200)) / 10) * 10,
    floors: round(clamp(8 + jitter(sd("fl"), 6), 0, 40), 0),
    load,
    training_readiness: round(clamp(sleepScore * 0.5 + (100 - stress) * 0.3 + (hrv / b.hrv) * 20, 5, 99), 0),
    vo2max: round(b.vo2max + jitter(sd("vo"), 0.4), 1),
    recovery_hours: round(clamp(load * 0.6 + jitter(sd("rh"), 8), 4, 96), 0),
    weight_kg: weight,
  };
}

/** rolling acute/chronic load from the generated daily loads */
function withAcwr(rows: ReturnType<typeof dayRow>[]) {
  // rows are today-first here; sort oldest-first for EWMA
  const asc = [...rows].sort((a, b) => a.metric_date.localeCompare(b.metric_date));
  let atl = asc[0].load ?? 50;
  let ctl = asc[0].load ?? 50;
  const kA = 2 / (7 + 1);
  const kC = 2 / (42 + 1);
  for (const r of asc) {
    const L = r.load ?? 0;
    atl = atl + kA * (L - atl);
    ctl = ctl + kC * (L - ctl);
    (r as Record<string, unknown>).atl = round(atl, 0);
    (r as Record<string, unknown>).ctl = round(ctl, 0);
  }
  return asc;
}

async function ensureCoach(): Promise<string> {
  const { data: list, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  let user = list.users.find((u) => u.email === COACH_EMAIL);
  if (!user) {
    const { data, error: cErr } = await db.auth.admin.createUser({
      email: COACH_EMAIL,
      email_confirm: true,
    });
    if (cErr) throw cErr;
    user = data.user;
    console.log(`created auth user ${COACH_EMAIL}`);
  }
  const { error: coachErr } = await db
    .from("coaches")
    .upsert({ id: user.id, name: COACH_NAME }, { onConflict: "id" });
  if (coachErr) throw coachErr;
  return user.id;
}

async function seed() {
  const coachId = await ensureCoach();

  const { error: delErr } = await db.from("athletes").delete().eq("coach_id", coachId);
  if (delErr) throw delErr;

  for (const p of DEMO_PROFILES) {
    const { data: inserted, error: aErr } = await db
      .from("athletes")
      .insert({ coach_id: coachId, name: p.name, focus: p.focus })
      .select("id")
      .single();
    if (aErr) throw aErr;
    const athleteId = inserted.id;

    let rows = Array.from({ length: DAYS }, (_, i) => dayRow(p, athleteId, i));
    rows = withAcwr(rows);

    // insert in chunks
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await db.from("daily_metrics").insert(rows.slice(i, i + 200));
      if (error) throw error;
    }

    if (p.checkin) {
      const c = p.checkin;
      const today = new Date().toISOString().slice(0, 10);
      const { error: cErr } = await db.from("daily_checkins").insert({
        athlete_id: athleteId,
        checkin_date: today,
        sleep_quality: c.sleepQuality,
        energy: c.energy,
        mood: c.mood,
        soreness: c.soreness,
        stress: c.stress,
        ate: c.ate,
        note: c.note,
        answers: {},
      });
      if (cErr) throw cErr;
    }

    console.log(`  ${p.name} — ${rows.length} days`);
  }

  console.log(`\nDone — ${DEMO_PROFILES.length} athletes under coach ${coachId}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
