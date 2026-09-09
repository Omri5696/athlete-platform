import { headers } from "next/headers";
import { getManagedAthletes } from "@/lib/athletes";
import { AthleteManager } from "@/components/AthleteManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "ניהול מתאמנים — מוקד בוקר" };

export default async function ManagePage() {
  const athletes = await getManagedAthletes();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  return (
    <main>
      <AthleteManager athletes={athletes} origin={origin} />
      <p className="foot-note">
        כל מתאמן מקבל קישור אישי לצ׳ק-אין. בהמשך נשלח אותו אוטומטית במייל כל בוקר.
      </p>
    </main>
  );
}
