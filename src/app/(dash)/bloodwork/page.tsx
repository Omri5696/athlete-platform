import Link from "next/link";
import { getPanels } from "@/lib/bloodwork";
import { getManagedAthletes } from "@/lib/athletes";
import { AddPanel } from "./AddPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "בדיקות דם — קשב" };

const HE = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" });

export default async function BloodworkPage() {
  const [panels, athletes] = await Promise.all([getPanels(), getManagedAthletes()]);

  return (
    <>
      <div className="page-head">
        <h1>בדיקות דם</h1>
        <p className="sub">
          מוסיפים תוצאות ידנית, ואפשר לבקש ניתוח AI לכל בדיקה.
        </p>
      </div>

      <AddPanel athletes={athletes.map((a) => ({ id: a.id, name: a.name }))} />

      {panels.length === 0 ? (
        <div className="empty">אין בדיקות עדיין.</div>
      ) : (
        <div className="list">
          {panels.map((p) => {
            const flagged = p.markers.filter((m) => m.outOfRange).length;
            return (
              <Link key={p.id} href={`/bloodwork/${p.id}`} className="li" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="grow">
                  <div className="t">
                    {p.athleteName} · {HE.format(new Date(p.drawnOn))}
                  </div>
                  <div className="meta">
                    <span>{p.markers.length} סמנים</span>
                    {flagged > 0 && <span className="flag">{flagged} מחוץ לטווח</span>}
                    {p.analysis && <span className="pill plain"><span className="dot" />יש ניתוח</span>}
                    {p.lab && <span>{p.lab}</span>}
                  </div>
                </div>
                <span className="muted">←</span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
