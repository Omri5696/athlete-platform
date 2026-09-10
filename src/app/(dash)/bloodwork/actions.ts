"use server";

import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPanel } from "@/lib/bloodwork";

export interface BwState {
  error?: string;
  ok?: boolean;
}

const numOrNull = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  const n = Number(s);
  return s !== "" && Number.isFinite(n) ? n : null;
};

export async function addPanel(_prev: BwState, formData: FormData): Promise<BwState> {
  await requireCoach();
  const athleteId = String(formData.get("athleteId") ?? "");
  const drawnOn = String(formData.get("drawnOn") ?? "");
  if (!athleteId || !drawnOn) return { error: "צריך מתאמן ותאריך." };

  const db = await createClient();
  const { error } = await db.from("blood_panels").insert({
    athlete_id: athleteId,
    drawn_on: drawnOn,
    lab: String(formData.get("lab") ?? "").trim() || null,
    fasting: formData.get("fasting") === "on",
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (error) return { error: "לא הצלחנו להוסיף." };

  revalidatePath("/bloodwork");
  return { ok: true };
}

export async function addMarker(_prev: BwState, formData: FormData): Promise<BwState> {
  await requireCoach();
  const panelId = String(formData.get("panelId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!panelId || !name) return { error: "צריך שם סמן." };

  const db = await createClient();
  const { error } = await db.from("blood_markers").insert({
    panel_id: panelId,
    name,
    value: numOrNull(formData.get("value")),
    unit: String(formData.get("unit") ?? "").trim() || null,
    ref_low: numOrNull(formData.get("refLow")),
    ref_high: numOrNull(formData.get("refHigh")),
  });
  if (error) return { error: "לא הצלחנו להוסיף." };

  revalidatePath(`/bloodwork/${panelId}`);
  return { ok: true };
}

export async function deleteMarker(formData: FormData): Promise<void> {
  await requireCoach();
  const id = String(formData.get("id") ?? "");
  const panelId = String(formData.get("panelId") ?? "");
  if (!id) return;
  const db = await createClient();
  await db.from("blood_markers").delete().eq("id", id);
  revalidatePath(`/bloodwork/${panelId}`);
}

export async function deletePanel(formData: FormData): Promise<void> {
  await requireCoach();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = await createClient();
  await db.from("blood_panels").delete().eq("id", id);
  revalidatePath("/bloodwork");
}

const MODEL = "claude-opus-5";

const SYSTEM = `אתה עוזר למאמן כושר לקרוא בדיקת דם של מתאמן סיבולת/כוח.
אתה לא רופא ולא נותן אבחנה. תפקידך: להצביע על מה שחורג מהטווח או ראוי לתשומת לב,
לתת הקשר רלוונטי לאתלטים (למשל: פריטין נמוך שכיח בספורטאי סיבולת; CK מוגבר נפוץ
אחרי אימון עצים; המוגלובין/המטוקריט מושפעים מהידרציה), ולומר בבירור מה כדאי
שהמתאמן יבדוק עם רופא.

כללים:
- כתוב בעברית, קצר וברור. עד ~200 מילים.
- אל תשתמש במילים "תקין", "בריא" או "מסוכן" באופן מוחלט.
- לכל ממצא חריג — משפט אחד: מה זה, הקשר אפשרי לאימון, והמלצה לבדוק עם רופא.
- אם אין מספיק מידע — תגיד את זה.
- סיים בשורה: "זו אינה חוות דעת רפואית. יש להתייעץ עם רופא."`;

export async function analyzePanel(
  _prev: BwState,
  formData: FormData,
): Promise<BwState> {
  await requireCoach();
  const panelId = String(formData.get("panelId") ?? "");
  if (!panelId) return { error: "פאנל לא נמצא." };

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      error:
        "כדי להפעיל ניתוח AI צריך להוסיף ANTHROPIC_API_KEY ל־.env.local ול־Vercel.",
    };
  }

  const panel = await getPanel(panelId);
  if (!panel) return { error: "פאנל לא נמצא." };
  if (panel.markers.length === 0) return { error: "אין סמנים לנתח. הוסף תוצאות קודם." };

  const markerLines = panel.markers
    .map((m) => {
      const range =
        m.refLow != null || m.refHigh != null
          ? ` (טווח ${m.refLow ?? "?"}–${m.refHigh ?? "?"})`
          : "";
      return `- ${m.name}: ${m.value ?? m.textValue ?? "?"} ${m.unit ?? ""}${range}${m.outOfRange ? " ⚠ מחוץ לטווח" : ""}`;
    })
    .join("\n");

  const userMsg = `מתאמן: ${panel.athleteName}
תאריך בדיקה: ${panel.drawnOn}${panel.fasting ? " · בצום" : ""}
${panel.notes ? `הערות: ${panel.notes}\n` : ""}
תוצאות:
${markerLines}`;

  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    });
    if (res.stop_reason === "refusal") {
      return { error: "הבקשה נדחתה. נסה שוב או פנה לרופא." };
    }
    const summary = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (!summary) return { error: "לא התקבל ניתוח." };

    const db = await createClient();
    await db.from("blood_analyses").insert({
      panel_id: panelId,
      summary,
      model: MODEL,
    });
    revalidatePath(`/bloodwork/${panelId}`);
    return { ok: true };
  } catch {
    return { error: "שגיאה בקריאה ל־AI. בדוק את ה־API key ונסה שוב." };
  }
}
