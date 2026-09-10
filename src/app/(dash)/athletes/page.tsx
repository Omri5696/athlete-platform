import { headers } from "next/headers";
import { getManagedAthletes } from "@/lib/athletes";
import { AthleteManager } from "@/components/AthleteManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "מתאמנים — קשב" };

export default async function AthletesPage() {
  const athletes = await getManagedAthletes();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  return (
    <>
      <div className="page-head">
        <h1>מתאמנים</h1>
        <p className="sub">
          {athletes.length} פעילים · לכל מתאמן קישור אישי לצ׳ק-אין
        </p>
      </div>
      <AthleteManager athletes={athletes} origin={origin} />
    </>
  );
}
