import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { getActiveQuestions } from "@/lib/questionnaire";
import { CheckinForm } from "../CheckinForm";
import { submitCheckin } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "צ׳ק-אין יומי" };

export default async function TokenCheckinPage({
  params,
}: PageProps<"/checkin/[token]">) {
  const { token } = await params;

  const db = createAdminClient();
  const { data: athlete } = await db
    .from("athletes")
    .select("name, coach_id")
    .eq("checkin_token", token)
    .is("archived_at", null)
    .maybeSingle();

  if (!athlete) notFound();

  const questions = await getActiveQuestions(athlete.coach_id, "daily");
  const save = submitCheckin.bind(null, token);
  const firstName = athlete.name.split(" ")[0];

  return (
    <div className="checkin-page">
      <CheckinForm questions={questions} submitAction={save} greetingName={firstName} />
    </div>
  );
}
