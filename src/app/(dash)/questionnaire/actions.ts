"use server";

import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface QState {
  error?: string;
}

const slug = (s: string) =>
  "q_" +
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9֐-׿]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) +
  "_" +
  Math.random().toString(36).slice(2, 6);

export async function addQuestion(
  _prev: QState,
  formData: FormData,
): Promise<QState> {
  const coach = await requireCoach();
  const label = String(formData.get("label") ?? "").trim();
  const kind = String(formData.get("kind") ?? "scale");
  if (!label) return { error: "צריך טקסט לשאלה." };

  const db = await createClient();
  const { data: max } = await db
    .from("questionnaire_questions")
    .select("position")
    .eq("form", "daily")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await db.from("questionnaire_questions").insert({
    coach_id: coach.id,
    form: "daily",
    key: slug(label),
    label,
    kind,
    low_label: kind === "scale" ? String(formData.get("lowLabel") ?? "") || null : null,
    high_label: kind === "scale" ? String(formData.get("highLabel") ?? "") || null : null,
    invert: formData.get("invert") === "on",
    position: (max?.position ?? 0) + 10,
  });
  if (error) return { error: "לא הצלחנו להוסיף." };

  revalidatePath("/questionnaire");
  return {};
}

export async function toggleQuestion(formData: FormData): Promise<void> {
  await requireCoach();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;
  const db = await createClient();
  await db.from("questionnaire_questions").update({ active: !active }).eq("id", id);
  revalidatePath("/questionnaire");
}

export async function moveQuestion(formData: FormData): Promise<void> {
  await requireCoach();
  const id = String(formData.get("id") ?? "");
  const dir = String(formData.get("dir") ?? "");
  if (!id || !["up", "down"].includes(dir)) return;

  const db = await createClient();
  const { data: rows } = await db
    .from("questionnaire_questions")
    .select("id, position")
    .eq("form", "daily")
    .order("position");
  if (!rows) return;

  const i = rows.findIndex((r) => r.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return;

  await db.from("questionnaire_questions").update({ position: rows[j].position }).eq("id", rows[i].id);
  await db.from("questionnaire_questions").update({ position: rows[i].position }).eq("id", rows[j].id);
  revalidatePath("/questionnaire");
}

export async function deleteQuestion(formData: FormData): Promise<void> {
  await requireCoach();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = await createClient();
  await db.from("questionnaire_questions").delete().eq("id", id);
  revalidatePath("/questionnaire");
}
