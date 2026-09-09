"use server";

import { createAdminClient } from "@/lib/supabase/server";

const clamp15 = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? Math.round(n) : null;
};
const numOrNull = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return v !== null && v !== "" && Number.isFinite(n) ? n : null;
};

/**
 * Save an athlete's daily check-in. Called from the public /checkin/[token]
 * page — the token is the only credential, so verify it and use the admin
 * client (this row has no coach session).
 */
export async function submitCheckin(
  token: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  const db = createAdminClient();

  const { data: athlete } = await db
    .from("athletes")
    .select("id")
    .eq("checkin_token", token)
    .is("archived_at", null)
    .maybeSingle();

  if (!athlete) return { error: "הקישור לא תקין. בקש מהמאמן קישור חדש." };

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await db.from("daily_checkins").upsert(
    {
      athlete_id: athlete.id,
      checkin_date: today,
      sleep_quality: clamp15(formData.get("sleepQuality")),
      energy: clamp15(formData.get("energy")),
      mood: clamp15(formData.get("mood")),
      soreness: clamp15(formData.get("soreness")),
      stress: clamp15(formData.get("stress")),
      sleep_hours: numOrNull(formData.get("sleepHours")),
      weight_kg: numOrNull(formData.get("weightKg")),
      ate: String(formData.get("ate") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
    },
    { onConflict: "athlete_id,checkin_date" },
  );

  if (error) return { error: "משהו השתבש בשמירה. נסה שוב." };
}
