import Link from "next/link";
import type { Athlete } from "@/lib/types";
import {
  band,
  bandLabel,
  delta,
  latest,
  readinessScore,
  type Delta,
} from "@/lib/readiness";
import { Sparkline } from "./Sparkline";

function Metric({
  label,
  value,
  d,
}: {
  label: string;
  value: string;
  d: Delta;
}) {
  return (
    <div className="metric">
      <span className="ml">{label}</span>
      <span className="mv">{value}</span>
      <span className={`md ${d.direction}${d.bad ? " bad" : ""}`}>{d.text}</span>
    </div>
  );
}

export function AthleteCard({ athlete }: { athlete: Athlete }) {
  const score = readinessScore(athlete);
  const b = band(score);

  return (
    <Link href={`/athletes/${athlete.id}`} className={`card ${b}`}>
      <div className="card-head">
        <div>
          <div className="name">{athlete.name}</div>
          <div className="focus">{athlete.focus}</div>
        </div>
        <span className={`pill ${b}`}>
          <span className="dot" />
          {bandLabel[b]} <span className="score">{score}</span>
        </span>
      </div>

      <div className="metrics">
        <Metric
          label="שינה"
          value={`${latest(athlete.sleepHours).toFixed(1)}ש׳`}
          d={delta(athlete.sleepHours, { decimals: 1 })}
        />
        <Metric
          label="HRV"
          value={`${latest(athlete.hrv)} מ״ש`}
          d={delta(athlete.hrv, { pct: true })}
        />
        <Metric
          label="דופק מנוחה"
          value={`${latest(athlete.rhr)}`}
          d={delta(athlete.rhr, { invert: true })}
        />
        <Metric
          label="Body Battery"
          value={`${latest(athlete.bodyBattery)}`}
          d={delta(athlete.bodyBattery)}
        />
      </div>

      <div className="card-foot">
        {athlete.checkin.submitted ? (
          <span className="checkin-badge done">
            <span className="mk">✓</span>מילא/ה צ׳ק-אין
          </span>
        ) : (
          <span className="checkin-badge wait">
            <span className="mk">!</span>ממתין לצ׳ק-אין
          </span>
        )}
        <Sparkline values={athlete.hrv} />
      </div>
    </Link>
  );
}
