import { DEMO_ATHLETES } from "@/lib/demo-data";
import { band, readinessScore } from "@/lib/readiness";
import { AthleteCard } from "@/components/AthleteCard";

const HE_DATE = new Intl.DateTimeFormat("he-IL", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default function DashboardPage() {
  const ranked = [...DEMO_ATHLETES]
    .map((a) => ({ athlete: a, score: readinessScore(a) }))
    .sort((x, y) => x.score - y.score);

  const counts = { ready: 0, watch: 0, risk: 0 };
  for (const { score } of ranked) counts[band(score)]++;
  const submitted = ranked.filter((r) => r.athlete.checkin.submitted).length;

  return (
    <main>
      <p className="brand sub" style={{ marginTop: "-14px", marginBottom: 18 }}>
        <b>{HE_DATE.format(new Date())}</b> · {ranked.length} מתאמנים
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
          <div className="k">מילאו צ׳ק-אין</div>
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

      <p className="foot-note">
        פרוטוטייפ · כל הנתונים מומצאים. בגרסה החיה נתוני השינה, ה־HRV, דופק המנוחה
        ו־Body Battery מגיעים אוטומטית מהשעון של כל מתאמן, וכל בוקר נשלח לו קישור
        אישי לצ׳ק-אין.
      </p>
    </main>
  );
}
