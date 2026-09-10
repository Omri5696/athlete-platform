import Link from "next/link";
import { getRoster } from "@/lib/athletes";
import { band, readinessScore } from "@/lib/readiness";
import { getOpenTasks } from "@/lib/tasks";
import { getCoachSettings } from "@/lib/settings";
import { RosterTable } from "./RosterTable";

export const dynamic = "force-dynamic";

const HE_DATE = new Intl.DateTimeFormat("he-IL", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function DashboardPage() {
  const [roster, openTasks, settings] = await Promise.all([
    getRoster(),
    getOpenTasks(),
    getCoachSettings(),
  ]);
  const th = settings.readiness;

  const counts = { ready: 0, watch: 0, risk: 0 };
  for (const a of roster) counts[band(readinessScore(a), th)]++;
  const submitted = roster.filter((a) => a.checkin.submitted).length;

  return (
    <>
      <div className="page-head">
        <h1>דשבורד</h1>
        <p className="sub">
          {HE_DATE.format(new Date())} · {roster.length} מתאמנים
          {openTasks.length > 0 && (
            <>
              {" · "}
              <Link href="/tasks">{openTasks.length} משימות פתוחות</Link>
            </>
          )}
        </p>
      </div>

      {roster.length === 0 ? (
        <div className="empty">
          עדיין אין מתאמנים. הוסף אותם ב<Link href="/athletes">מתאמנים</Link>.
        </div>
      ) : (
        <>
          <section className="summary">
            <div className="stat risk">
              <div className="k">בסיכון</div>
              <div className="v num">{counts.risk}</div>
            </div>
            <div className="stat watch">
              <div className="k">במעקב</div>
              <div className="v num">{counts.watch}</div>
            </div>
            <div className="stat ready">
              <div className="k">מוכנים</div>
              <div className="v num">{counts.ready}</div>
            </div>
            <div className="stat">
              <div className="k">צ׳ק-אין היום</div>
              <div className="v num">
                {submitted}
                <small> / {roster.length}</small>
              </div>
            </div>
          </section>

          <RosterTable athletes={roster} thresholds={th} />
        </>
      )}
    </>
  );
}
