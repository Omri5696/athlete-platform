"use server";

import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface TaskState {
  error?: string;
}

export async function addTask(
  _prev: TaskState,
  formData: FormData,
): Promise<TaskState> {
  const coach = await requireCoach();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "צריך תיאור למשימה." };
  const athleteId = String(formData.get("athleteId") ?? "") || null;
  const dueDate = String(formData.get("dueDate") ?? "") || null;

  const db = await createClient();
  const { error } = await db.from("tasks").insert({
    coach_id: coach.id,
    title,
    athlete_id: athleteId,
    due_date: dueDate,
  });
  if (error) return { error: "לא הצלחנו להוסיף." };

  revalidatePath("/tasks");
  revalidatePath("/");
  return {};
}

export async function toggleTask(formData: FormData): Promise<void> {
  await requireCoach();
  const id = String(formData.get("id") ?? "");
  const done = String(formData.get("done") ?? "") === "true";
  if (!id) return;

  const db = await createClient();
  await db
    .from("tasks")
    .update({ done: !done, done_at: !done ? new Date().toISOString() : null })
    .eq("id", id);

  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function deleteTask(formData: FormData): Promise<void> {
  await requireCoach();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = await createClient();
  await db.from("tasks").delete().eq("id", id);
  revalidatePath("/tasks");
  revalidatePath("/");
}
