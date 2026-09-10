import Link from "next/link";
import { notFound } from "next/navigation";
import { getAthlete } from "@/lib/athletes";
import { band, bandLabel, readinessScore } from "@/lib/readiness";
import { athleteFlags } from "@/lib/flags";
import { getCoachSettings } from "@/lib/settings";
import { analyseReadiness, metricSeries } from "@/lib/analysis";
import { Sparkline } from "@/components/Sparkline";
import { LogMetrics } from "./LogMetrics";
import type { Checkin, MetricKey } from "@/lib/types";
import type { Athlete } from "@/lib/types";

export const dynamic = "force-dynamic";

const SUBJ: {
  key: keyof Extract<Checkin, { submitted: true }>;
  label: string;
  higherIsBetter: boolean;
}[] = [
  { key: "sleepQuality", label: "איכות שינה", higherIsBetter: true },
  { key: "energy", label: "אנרגיה", higherIsBetter: true },
  { key: "mood", label: "מצב רוח", higherIsBetter: true },
  { key: "soreness", label: "כאבי שרירים", higherIsBetter: false },
  { key: "stress", label: "רמת לחץ", higherIsBetter: false },
];

const TRENDS: { key: MetricKey; label: string; unit: string }[] = [
  { key: "hrv", label: "HRV (בוקר)", unit: "מ״ש" },
  { key: "rhr", label: "דופק מנוחה", unit: "" },
  { key: "sleepHours", label: "שעות שינה", unit: "ש׳" },
  { key: "sleepScore", label: "ציון שינה", unit: "" },
  { key: "bodyBattery", label: "Body Battery", unit: "" },
  { key: "stressAvg", label: "סטרס יומי", unit: "" },
  { key: "respiration", label: "קצב נשימה", unit: "נש׳/דק׳" },
  { key: "steps", label: "צעדים", unit: "" },
  { key: "load", label: "עומס אימון", unit: "TL" },
  { key: "vo2max", label: "VO₂max", unit: "" },
  { key: "weightKg", label: "משקל", unit: "ק״ג" },
];

function Trend({ label, unit, series }: { label: string; unit: string; series: number[] }) {
  if (series.length < 3) return null;
  const shown = series.slice(-35);
  const v = series[series.length - 1];
  return (
    <div className="trend">
      <div className="tl">{label}</div>
      <div className="tv">
        {Number.isInteger(v) ? v : v.toFixed(1)}
        {unit && <small> {unit}</small>}
      </div>
      <div className="tspark">
        <Sparkline values={shown} width={260} height={48} className="spark lg" smoothWindow={5} />
      </div>
      <div className="trange">
        <span>שיא {Math.round(Math.max(...shown) * 10) / 10}</span>
        <span>{shown.length} ימים</span>
        <span>שפל {Math.round(Math.min(...shown) * 10) / 10}</span>
      </div>
    </div>
  );
}

function SubjRow({ label, value, higherIsBetter }: { label: string; value: number; higherIsBetter: boolean }) {
  return (
    <div className="srow">
      <span className="sl">{label}</span>
      <span className="track">
        {[1, 2, 3, 4, 5].map((n) => {
          if (n > value) return <span key={n} className="seg" />;
          const bad = higherIsBetter ? value <= 2 : value >= 4;
          const mid = value === 3;
          return <span key={n} className={`seg on${bad ? " bad" : mid ? " mid" : ""}`} />;
        })}
      </span>
      <span className="sn">{value}/5</span>
    </div>
  );
}

function DomainBar({ label, score }: { label: string; score: number | null }) {
  if (score == null) return null;
  const tone = score >= 62 ? "ready" : score >= 42 ? "watch" : "risk";
  return (
    <div className="dbar">
      <div className="dbar-top">
        <span>{label}</span>
        <span className="num" style={{ fontWeight: 600 }}>{score}</span>
      </div>
      <div className="dbar-track">
        <span className={`dbar-fill ${tone}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default async function AthletePage({ params }: PageProps<"/athletes/[id]">) {
  const { id } = await params;
  const [athlete, settings] = await Promise.all([getAthlete(id), getCoachSettings()]);
  if (!athlete) notFound();
  const a: Athlete = athlete;

  const score = readinessScore(a);
  const b = band(score, settings.readiness);
  const flags = athleteFlags(a);
  const analysis = analyseReadiness(a);
  const { checkin } = a;

  const lastDate = a.days.at(-1)?.date ?? null;

  return (
    <>
      <Link href="/" className="back-link">← חזרה לדשבורד</Link>
      <div className="detail-head">
        <div>
          <div className="name">{a.name}</div>
          <div className="focus">{a.focus || "—"}</div>
        </div>
        <span className={`pill ${b}`}>
          <span className="dot" />
          {bandLabel[b]} {score}
        </span>
      </div>

      {flags.length > 0 && (
        <div className="flag-row">
          {flags.map((f) => (
            <span key={f.key} className={`flag ${f.severity === "risk" ? "risk" : ""}`}>
              {f.label}
            </span>
          ))}
        </div>
      )}

      <div className="panel">
        <h2>תמונת מצב</h2>
        <div className="domains">
          <DomainBar label="התאוששות" score={analysis.recovery} />
          <DomainBar label="עומס" score={analysis.load} />
          <DomainBar label="תחושה" score={analysis.subjective} />
        </div>
        {analysis.drivers.length > 0 && (
          <p className="drivers">
            <span className="muted">מה מזיז את הציון: </span>
            {analysis.drivers.map((d, i) => (
              <span key={i}>
                {i > 0 && " · "}
                {d.label}
                {d.note ? ` (${d.note})` : ""}
              </span>
            ))}
          </p>
        )}
        {analysis.coherenceGap != null && Math.abs(analysis.coherenceGap) >= 15 && (
          <p className="drivers" style={{ marginTop: 6 }}>
            <span className="muted">פער אובייקטיבי↔סובייקטיבי: </span>
            {analysis.coherenceGap > 0
              ? "המספרים נמוכים מהתחושה — ייתכן לחץ חיים או תשישות מוסתרת"
              : "המספרים תקינים אבל מרגיש רע — לחקור"}
          </p>
        )}
      </div>

      <div className="panel">
        <h2>הזנת נתונים</h2>
        <LogMetrics athleteId={a.id} lastDate={lastDate} />
      </div>

      <p className="section-title">מגמות</p>
      <div className="trend-grid">
        {TRENDS.map((t) => (
          <Trend key={t.key} label={t.label} unit={t.unit} series={metricSeries(a.days, t.key)} />
        ))}
      </div>

      <div className="panel">
        <h2>צ׳ק-אין הבוקר</h2>
        {checkin.submitted ? (
          <>
            <div className="subj-rows">
              {SUBJ.map((s) => (
                <SubjRow
                  key={s.key}
                  label={s.label}
                  value={checkin[s.key] as number}
                  higherIsBetter={s.higherIsBetter}
                />
              ))}
            </div>
            {checkin.ate && (
              <div className="note">
                <div className="nl">תזונה אתמול</div>
                {checkin.ate}
              </div>
            )}
            {checkin.note && (
              <div className="note">
                <div className="nl">הערה של המתאמן/ת</div>
                {checkin.note}
              </div>
            )}
          </>
        ) : (
          <div className="no-checkin">טרם מולא היום.</div>
        )}
      </div>
    </>
  );
}
