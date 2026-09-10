"use server";

import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface ManageState {
  error?: string;
  ok?: boolean;
}

/** form field name -> daily_metrics column. All numeric, all optional. */
const METRIC_COLS: Record<string, string> = {
  hrv: "hrv",
  rhr: "rhr",
  sleepHours: "sleep_hours",
  sleepScore: "sleep_score",
  bodyBattery: "body_battery",
  stressAvg: "stress_avg",
  respiration: "respiration",
  spo2Avg: "spo2_avg",
  steps: "steps",
  activeMin: "active_min",
  load: "load",
  atl: "atl",
  ctl: "ctl",
  trainingReadiness: "training_readiness",
  vo2max: "vo2max",
  weightKg: "weight_kg",
  sleepDeepMin: "sleep_deep_min",
  sleepRemMin: "sleep_rem_min",
};

export async function logDay(
  _prev: ManageState,
  formData: FormData,
): Promise<ManageState> {
  await requireCoach();
  const athleteId = String(formData.get("athleteId") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!athleteId || !date) return { error: "צריך תאריך." };

  const row: Record<string, unknown> = {
    athlete_id: athleteId,
    metric_date: date,
    source: "manual",
  };
  let any = false;
  for (const [field, col] of Object.entries(METRIC_COLS)) {
    const raw = String(formData.get(field) ?? "").trim();
    if (raw === "") continue;
    const n = Number(raw);
    if (Number.isFinite(n)) {
      row[col] = n;
      any = true;
    }
  }
  const bedtime = String(formData.get("bedtime") ?? "").trim();
  const wake = String(formData.get("wakeTime") ?? "").trim();
  if (bedtime) {
    row.bedtime = bedtime;
    any = true;
  }
  if (wake) {
    row.wake_time = wake;
    any = true;
  }
  if (!any) return { error: "לא הוזן אף מדד." };

  const db = await createClient();
  const { error } = await db
    .from("daily_metrics")
    .upsert(row, { onConflict: "athlete_id,metric_date" });
  if (error) return { error: "לא הצלחנו לשמור." };

  revalidatePath(`/athletes/${athleteId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function addAthlete(
  _prev: ManageState,
  formData: FormData,
): Promise<ManageState> {
  const coach = await requireCoach();
  const name = String(formData.get("name") ?? "").trim();
  const focus = String(formData.get("focus") ?? "").trim();
  if (!name) return { error: "צריך שם." };

  const db = await createClient();
  const { error } = await db
    .from("athletes")
    .insert({ coach_id: coach.id, name, focus });
  if (error) return { error: "לא הצלחנו להוסיף. נסה שוב." };

  revalidatePath("/athletes");
  revalidatePath("/");
  return { ok: true };
}

export async function updateAthlete(
  _prev: ManageState,
  formData: FormData,
): Promise<ManageState> {
  await requireCoach();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const focus = String(formData.get("focus") ?? "").trim();
  if (!id || !name) return { error: "צריך שם." };

  const db = await createClient();
  const { error } = await db
    .from("athletes")
    .update({ name, focus })
    .eq("id", id);
  if (error) return { error: "לא הצלחנו לשמור." };

  revalidatePath("/athletes");
  revalidatePath("/");
  revalidatePath(`/athletes/${id}`);
  return { ok: true };
}

export async function archiveAthlete(formData: FormData): Promise<void> {
  await requireCoach();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const db = await createClient();
  await db
    .from("athletes")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/athletes");
  revalidatePath("/");
}
