import { getRoster } from "@/lib/athletes";
import { band, readinessScore } from "@/lib/readiness";
import { AthleteCard } from "@/components/AthleteCard";

// Reads live data per request (and will be per-coach once login exists).
export const dynamic = "force-dynamic";

const HE_DATE = new Intl.DateTimeFormat("he-IL", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function DashboardPage() {
  const roster = await getRoster();
  const ranked = roster
    .map((a) => ({ athlete: a, score: readinessScore(a) }))
    .sort((x, y) => x.score - y.score);

  const counts = { ready: 0, watch: 0, risk: 0 };
  for (const { score } of ranked) counts[band(score)]++;
  const submitted = ranked.filter((r) => r.athlete.checkin.submitted).length;

  if (ranked.length === 0) {
    return (
      <main>
        <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
          עדיין אין מתאמנים. הוסף מתאמנים במסך <b>ניהול מתאמנים</b>.
        </div>
      </main>
    );
  }

  return (
    <main>
      <p className="page-intro">
        <span className="today">{HE_DATE.format(new Date())}</span>
        <span>{ranked.length} מתאמנים · {submitted} מילאו צ׳ק-אין</span>
      </p>

      <section className="summary">
        <div className="stat risk">
          <div className="k">בסיכון · דורש התייחסות</div>
          <div className="v">{counts.risk}</div>
        </div>
        <div className="stat watch">
          <div className="k">במעקב</div>
          <div className="v">{counts.watch}</div>
        </div>
        <div className="stat ready">
          <div className="k">מוכנים לאימון</div>
          <div className="v">{counts.ready}</div>
        </div>
        <div className="stat">
          <div className="k">צ׳ק-אין היום</div>
          <div className="v">
            {submitted}
            <small> / {ranked.length}</small>
          </div>
        </div>
      </section>

      <div className="section-label">מסודר לפי דחיפוּת · לחיצה על מתאמן לפירוט</div>

      <div className="grid">
        {ranked.map(({ athlete }) => (
          <AthleteCard key={athlete.id} athlete={athlete} />
        ))}
      </div>
    </main>
  );
}
