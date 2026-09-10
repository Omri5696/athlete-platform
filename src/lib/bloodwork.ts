import "server-only";
import { createClient } from "./supabase/server";
import { requireCoach } from "./auth";

export interface Marker {
  id: string;
  name: string;
  value: number | null;
  textValue: string | null;
  unit: string | null;
  refLow: number | null;
  refHigh: number | null;
  outOfRange: boolean;
}

export interface Panel {
  id: string;
  athleteId: string;
  athleteName: string;
  drawnOn: string;
  lab: string | null;
  fasting: boolean | null;
  notes: string | null;
  markers: Marker[];
  analysis: { summary: string; model: string | null; createdAt: string } | null;
}

interface PanelRow {
  id: string;
  athlete_id: string;
  drawn_on: string;
  lab: string | null;
  fasting: boolean | null;
  notes: string | null;
  athletes: { name: string } | null;
}
interface MarkerRow {
  id: string;
  panel_id: string;
  name: string;
  value: number | null;
  text_value: string | null;
  unit: string | null;
  ref_low: number | null;
  ref_high: number | null;
}

function toMarker(r: MarkerRow): Marker {
  const out =
    r.value != null &&
    ((r.ref_low != null && r.value < r.ref_low) ||
      (r.ref_high != null && r.value > r.ref_high));
  return {
    id: r.id,
    name: r.name,
    value: r.value,
    textValue: r.text_value,
    unit: r.unit,
    refLow: r.ref_low,
    refHigh: r.ref_high,
    outOfRange: out,
  };
}

/** All panels for the coach's athletes, newest first, with markers + latest analysis. */
export async function getPanels(): Promise<Panel[]> {
  await requireCoach();
  const db = await createClient();

  const { data: panels, error } = await db
    .from("blood_panels")
    .select("id, athlete_id, drawn_on, lab, fasting, notes, athletes(name)")
    .order("drawn_on", { ascending: false })
    .returns<PanelRow[]>();
  if (error) throw error;
  if (!panels?.length) return [];

  const ids = panels.map((p) => p.id);
  const [{ data: markers }, { data: analyses }] = await Promise.all([
    db.from("blood_markers").select("*").in("panel_id", ids).order("name").returns<MarkerRow[]>(),
    db
      .from("blood_analyses")
      .select("panel_id, summary, model, created_at")
      .in("panel_id", ids)
      .order("created_at", { ascending: false }),
  ]);

  const byPanel = new Map<string, MarkerRow[]>();
  for (const m of markers ?? []) {
    const arr = byPanel.get(m.panel_id) ?? [];
    arr.push(m);
    byPanel.set(m.panel_id, arr);
  }
  const latestAnalysis = new Map<string, { summary: string; model: string | null; created_at: string }>();
  for (const a of analyses ?? []) {
    if (!latestAnalysis.has(a.panel_id)) latestAnalysis.set(a.panel_id, a);
  }

  return panels.map((p) => {
    const a = latestAnalysis.get(p.id);
    return {
      id: p.id,
      athleteId: p.athlete_id,
      athleteName: p.athletes?.name ?? "—",
      drawnOn: p.drawn_on,
      lab: p.lab,
      fasting: p.fasting,
      notes: p.notes,
      markers: (byPanel.get(p.id) ?? []).map(toMarker),
      analysis: a
        ? { summary: a.summary, model: a.model, createdAt: a.created_at }
        : null,
    };
  });
}

export async function getPanel(id: string): Promise<Panel | null> {
  const all = await getPanels();
  return all.find((p) => p.id === id) ?? null;
}
