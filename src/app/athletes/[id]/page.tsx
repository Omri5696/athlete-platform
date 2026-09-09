import Link from "next/link";
import { notFound } from "next/navigation";
import { getAthlete } from "@/lib/athletes";
import { band, bandLabel, latest, readinessScore } from "@/lib/readiness";
import { Sparkline } from "@/components/Sparkline";
import type { Checkin } from "@/lib/types";

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

function Trend({
  label,
  series,
  unit,
}: {
  label: string;
  series: number[];
  unit: string;
}) {
  const value = latest(series);
  return (
    <div className="trend">
      <div className="tl">{label}</div>
      <div className="tv">
        {Number.isInteger(value) ? value : value.toFixed(1)}
        <small> {unit}</small>
      </div>
      <div className="tspark">
        <Sparkline values={series} width={260} height={52} className="spark lg" />
      </div>
      <div className="trange">
        <span>שיא {Math.max(...series)}</span>
        <span>לפני 7 ימים</span>
        <span>שפל {Math.min(...series)}</span>
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
          return (
            <span
              key={n}
              className={`seg on${bad ? " bad" : mid ? " mid" : ""}`}
            />
          );
        })}
      </span>
      <span className="sn">{value}/5</span>
    </div>
  );
}

export default async function AthletePage({
  params,
}: PageProps<"/athletes/[id]">) {
  const { id } = await params;
  const athlete = await getAthlete(id);
  if (!athlete) notFound();

  const score = readinessScore(athlete);
  const b = band(score);
  const { checkin } = athlete;

  return (
    <main>
      <div className="detail-head">
        <div>
          <Link href="/" className="back-link">
            ← חזרה למוקד הבוקר
          </Link>
          <div className="name" style={{ marginTop: 8 }}>
            {athlete.name}
          </div>
          <div className="focus">{athlete.focus}</div>
        </div>
        <span className={`pill ${b}`}>
          <span className="dot" />
          {bandLabel[b]} <span className="score">{score}</span>
        </span>
      </div>

      <div className="section-label">7 ימים אחרונים</div>
      <div className="trend-grid">
        <Trend label="HRV (בוקר)" series={athlete.hrv} unit="מ״ש" />
        <Trend label="שעות שינה" series={athlete.sleepHours} unit="ש׳" />
        <Trend label="דופק מנוחה" series={athlete.rhr} unit="פעימות" />
        <Trend label="עומס אימון יומי" series={athlete.load} unit="TL" />
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
            <div className="note">
              <div className="nl">תזונה אתמול</div>
              {checkin.ate}
            </div>
            <div className="note">
              <div className="nl">הערה של המתאמן/ת</div>
              {checkin.note}
            </div>
          </>
        ) : (
          <div className="no-checkin">
            טרם מולא. תזכורת נשלחה ב־06:00. שווה לבדוק לפני שמחליטים על האימון.
          </div>
        )}
      </div>
    </main>
  );
}
