"use server";

import { createAdminClient } from "@/lib/supabase/server";

const SCALE_COLS = new Set(["sleepQuality", "energy", "mood", "soreness", "stress"]);
const NUM_COLS: Record<string, string> = {
  sleepHours: "sleep_hours",
  weightKg: "weight_kg",
};
const TEXT_COLS: Record<string, string> = { ate: "ate", note: "note" };

/**
 * Save an athlete's daily check-in. Public — the token is the only credential,
 * so verify it and use the admin client.
 */
export async function submitCheckin(
  token: string,
  values: Record<string, string>,
): Promise<{ error?: string } | void> {
  const db = createAdminClient();

  const { data: athlete } = await db
    .from("athletes")
    .select("id")
    .eq("checkin_token", token)
    .is("archived_at", null)
    .maybeSingle();
  if (!athlete) return { error: "הקישור לא תקין. בקש מהמאמן קישור חדש." };

  const row: Record<string, unknown> = {
    athlete_id: athlete.id,
    checkin_date: new Date().toISOString().slice(0, 10),
  };
  const answers: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(values)) {
    const v = raw.trim();
    if (SCALE_COLS.has(key)) {
      const n = Number(v);
      if (n >= 1 && n <= 5) row[key === "sleepQuality" ? "sleep_quality" : key.toLowerCase()] = Math.round(n);
    } else if (NUM_COLS[key]) {
      const n = Number(v);
      if (v !== "" && Number.isFinite(n)) row[NUM_COLS[key]] = n;
    } else if (TEXT_COLS[key]) {
      if (v) row[TEXT_COLS[key]] = v;
    } else if (v) {
      answers[key] = v;
    }
  }
  row.answers = answers;

  const { error } = await db
    .from("daily_checkins")
    .upsert(row, { onConflict: "athlete_id,checkin_date" });
  if (error) return { error: "משהו השתבש בשמירה. נסה שוב." };
}
