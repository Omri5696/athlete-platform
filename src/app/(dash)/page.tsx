import Link from "next/link";
import { getRoster } from "@/lib/athletes";
import {
  band,
  bandLabel,
  delta,
  latest,
  readinessScore,
} from "@/lib/readiness";
import { athleteFlags } from "@/lib/flags";
import { getOpenTasks } from "@/lib/tasks";
import { getCoachSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const HE_DATE = new Intl.DateTimeFormat("he-IL", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function Metric({
  label,
  value,
  d,
}: {
  label: string;
  value: string;
  d?: { text: string; direction: string; bad: boolean };
}) {
  return (
    <div className="m">
      <span className="ml">{label}</span>
      <span className="mv num">
        {value}
        {d && (
          <span className={`d ${d.direction}${d.bad ? " bad" : ""}`}>
            {d.text}
          </span>
        )}
      </span>
    </div>
  );
}

export default async function DashboardPage() {
  const [roster, openTasks, settings] = await Promise.all([
    getRoster(),
    getOpenTasks(),
    getCoachSettings(),
  ]);
  const th = settings.readiness;

  const ranked = roster
    .map((a) => ({
      a,
      score: readinessScore(a),
      flags: athleteFlags(a),
    }))
    .sort((x, y) => x.score - y.score);

  const counts = { ready: 0, watch: 0, risk: 0 };
  for (const r of ranked) counts[band(r.score, th)]++;
  const submitted = ranked.filter((r) => r.a.checkin.submitted).length;

  return (
    <>
      <div className="page-head">
        <h1>דשבורד</h1>
        <p className="sub">
          {HE_DATE.format(new Date())} · {ranked.length} מתאמנים
          {openTasks.length > 0 && (
            <>
              {" · "}
              <Link href="/tasks">{openTasks.length} משימות פתוחות</Link>
            </>
          )}
        </p>
      </div>

      {ranked.length === 0 ? (
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
                <small> / {ranked.length}</small>
              </div>
            </div>
          </section>

          <p className="section-title">מסודר לפי דחיפוּת</p>
          <div className="roster">
            {ranked.map(({ a, score, flags }) => {
              const b = band(score, th);
              return (
                <Link key={a.id} href={`/athletes/${a.id}`} className="rrow">
                  <div className="who">
                    <span className={`sdot ${b}`} />
                    <span>
                      <span className="nm">{a.name}</span>
                      <span className="fc">{a.focus || "—"}</span>
                    </span>
                  </div>
                  <div className="right">
                    {flags.length > 0 && (
                      <span className="flags">
                        {flags.slice(0, 2).map((f) => (
                          <span
                            key={f.key}
                            className={`flag ${f.severity === "risk" ? "risk" : ""}`}
                          >
                            {f.label}
                          </span>
                        ))}
                      </span>
                    )}
                    <span className="mtx">
                      <Metric
                        label="שינה"
                        value={`${latest(a.sleepHours).toFixed(1)}`}
                        d={delta(a.sleepHours, { decimals: 1 })}
                      />
                      <Metric
                        label="HRV"
                        value={`${latest(a.hrv)}`}
                        d={delta(a.hrv, { pct: true })}
                      />
                      <Metric
                        label="דופק"
                        value={`${latest(a.rhr)}`}
                        d={delta(a.rhr, { invert: true })}
                      />
                    </span>
                    <span
                      className={`score ${b}`}
                      title={`מוכנוּת · ${bandLabel[b]}`}
                    >
                      {score}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
