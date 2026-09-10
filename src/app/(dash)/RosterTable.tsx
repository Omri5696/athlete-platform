"use client";

import { useRouter } from "next/navigation";
import type { Athlete, Band } from "@/lib/types";
import { band, bandLabel, delta, latest, readinessScore } from "@/lib/readiness";
import { athleteFlags } from "@/lib/flags";

function Cell({ value, series, opts }: {
  value: string;
  series: number[];
  opts: Parameters<typeof delta>[1];
}) {
  const d = delta(series, opts);
  return (
    <span className="mv">
      {value}
      {d.text !== "±0" && (
        <span className={`d ${d.direction}${d.bad ? " bad" : ""}`}>{d.text}</span>
      )}
    </span>
  );
}

export function RosterTable({
  athletes,
  thresholds,
}: {
  athletes: Athlete[];
  thresholds: { greenAt: number; amberAt: number };
}) {
  const router = useRouter();

  const rows = athletes
    .map((a) => ({ a, score: readinessScore(a), flags: athleteFlags(a) }))
    .sort((x, y) => x.score - y.score);

  return (
    <div className="table-wrap">
      <table className="rtable">
        <thead>
          <tr>
            <th>מתאמן</th>
            <th className="n hide-sm">שינה</th>
            <th className="n hide-sm">HRV</th>
            <th className="n hide-sm">דופק</th>
            <th>דגלים</th>
            <th className="n">מוכנוּת</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ a, score, flags }) => {
            const b: Band = band(score, thresholds);
            return (
              <tr
                key={a.id}
                onClick={() => router.push(`/athletes/${a.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") router.push(`/athletes/${a.id}`);
                }}
                tabIndex={0}
              >
                <td>
                  <span className="who">
                    <span className={`sdot ${b}`} />
                    <span>
                      <span className="nm" style={{ display: "block" }}>{a.name}</span>
                      <span className="fc">{a.focus || "—"}</span>
                    </span>
                  </span>
                </td>
                <td className="n hide-sm">
                  <Cell value={latest(a.sleepHours).toFixed(1)} series={a.sleepHours} opts={{ decimals: 1 }} />
                </td>
                <td className="n hide-sm">
                  <Cell value={`${latest(a.hrv)}`} series={a.hrv} opts={{ pct: true }} />
                </td>
                <td className="n hide-sm">
                  <Cell value={`${latest(a.rhr)}`} series={a.rhr} opts={{ invert: true }} />
                </td>
                <td>
                  <span className="flags">
                    {flags.slice(0, 2).map((f) => (
                      <span key={f.key} className={`flag ${f.severity === "risk" ? "risk" : ""}`}>
                        {f.label}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="n">
                  <span className={`score-pill ${b}`} title={bandLabel[b]}>
                    {score}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
