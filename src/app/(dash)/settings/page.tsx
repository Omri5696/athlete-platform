import { getCoach } from "@/lib/auth";
import { getCoachSettings } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "הגדרות — קשב" };

export default async function SettingsPage() {
  const [coach, settings] = await Promise.all([getCoach(), getCoachSettings()]);

  return (
    <>
      <div className="page-head">
        <h1>הגדרות מערכת</h1>
        <p className="sub">מחובר כ־{coach?.email}</p>
      </div>

      <SettingsForm
        name={coach?.name ?? ""}
        greenAt={settings.readiness.greenAt}
        amberAt={settings.readiness.amberAt}
      />

      <div className="card" style={{ marginTop: 20 }}>
        <p className="section-title">מצב תצוגה</p>
        <p className="muted" style={{ fontSize: 13 }}>
          קשב עוקב אחרי המצב הבהיר/כהה של המערכת ההפעלה. מצב ידני יתווסף בהמשך.
        </p>
      </div>
    </>
  );
}
