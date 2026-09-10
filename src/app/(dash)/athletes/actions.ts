"use server";

import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface ManageState {
  error?: string;
  ok?: boolean;
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
