import "server-only";
import { createClient } from "./supabase/server";
import { requireCoach } from "./auth";

export interface CoachSettings {
  readiness: { greenAt: number; amberAt: number };
}

export const DEFAULT_SETTINGS: CoachSettings = {
  readiness: { greenAt: 70, amberAt: 50 },
};

export async function getCoachSettings(): Promise<CoachSettings> {
  await requireCoach();
  const db = await createClient();
  const { data } = await db
    .from("coach_settings")
    .select("settings")
    .maybeSingle();

  const s = (data?.settings ?? {}) as Partial<CoachSettings>;
  return {
    readiness: {
      greenAt: s.readiness?.greenAt ?? DEFAULT_SETTINGS.readiness.greenAt,
      amberAt: s.readiness?.amberAt ?? DEFAULT_SETTINGS.readiness.amberAt,
    },
  };
}
