import "server-only";
import { createClient, createAdminClient } from "./supabase/server";
import { requireCoach } from "./auth";

export interface Question {
  id: string;
  form: "daily" | "weekly";
  key: string;
  label: string;
  kind: "scale" | "number" | "text" | "boolean";
  lowLabel: string | null;
  highLabel: string | null;
  invert: boolean;
  position: number;
  active: boolean;
}

interface QRow {
  id: string;
  form: "daily" | "weekly";
  key: string;
  label: string;
  kind: Question["kind"];
  low_label: string | null;
  high_label: string | null;
  invert: boolean;
  position: number;
  active: boolean;
}

const toQuestion = (r: QRow): Question => ({
  id: r.id,
  form: r.form,
  key: r.key,
  label: r.label,
  kind: r.kind,
  lowLabel: r.low_label,
  highLabel: r.high_label,
  invert: r.invert,
  position: r.position,
  active: r.active,
});

/** All questions for the signed-in coach (both forms), for the builder screen. */
export async function getAllQuestions(): Promise<Question[]> {
  await requireCoach();
  const db = await createClient();
  const { data, error } = await db
    .from("questionnaire_questions")
    .select("*")
    .order("form")
    .order("position")
    .returns<QRow[]>();
  if (error) throw error;
  return (data ?? []).map(toQuestion);
}

/** Active questions for a form, by coach id — used by the public check-in via admin client. */
export async function getActiveQuestions(
  coachId: string,
  form: "daily" | "weekly" = "daily",
): Promise<Question[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("questionnaire_questions")
    .select("*")
    .eq("coach_id", coachId)
    .eq("form", form)
    .eq("active", true)
    .order("position")
    .returns<QRow[]>();
  if (error) throw error;
  return (data ?? []).map(toQuestion);
}
