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

    </>
  );
}
