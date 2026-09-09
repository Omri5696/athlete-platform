import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export interface Coach {
  id: string;
  name: string;
  email: string;
}

/** The signed-in coach, or null. Ensures a matching `coaches` row exists. */
export async function getCoach(): Promise<Coach | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row } = await supabase
    .from("coaches")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  let name = row?.name;
  if (!name) {
    // first login for a user created outside the app — backfill the row
    name = (user.user_metadata?.name as string) ?? user.email ?? "מאמן";
    await supabase.from("coaches").upsert({ id: user.id, name });
  }

  return { id: user.id, name, email: user.email ?? "" };
}

/** Like getCoach, but redirects to /login when there is no session. */
export async function requireCoach(): Promise<Coach> {
  const coach = await getCoach();
  if (!coach) redirect("/login");
  return coach;
}
