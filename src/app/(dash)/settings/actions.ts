"use server";

import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface SettingsState {
  ok?: boolean;
  error?: string;
}

export async function saveSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const coach = await requireCoach();
  const name = String(formData.get("name") ?? "").trim();
  const greenAt = Number(formData.get("greenAt"));
  const amberAt = Number(formData.get("amberAt"));

  if (!name) return { error: "צריך שם." };
  if (!(amberAt > 0 && greenAt > amberAt && greenAt < 100)) {
    return { error: "ספי המוכנוּת לא תקינים (צהוב < ירוק < 100)." };
  }

  const db = await createClient();

  const { error: e1 } = await db
    .from("coaches")
    .update({ name })
    .eq("id", coach.id);
  if (e1) return { error: "לא הצלחנו לשמור." };

  const { error: e2 } = await db.from("coach_settings").upsert({
    coach_id: coach.id,
    settings: { readiness: { greenAt, amberAt } },
    updated_at: new Date().toISOString(),
  });
  if (e2) return { error: "לא הצלחנו לשמור את ההגדרות." };

  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true };
}
