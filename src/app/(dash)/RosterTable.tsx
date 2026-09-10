"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Athlete, Band, MetricKey } from "@/lib/types";
import { band, bandLabel, latest, metricDelta, readinessScore } from "@/lib/readiness";
import { athleteFlags } from "@/lib/flags";

function Cell({
  days,
  metric,
  opts,
  fmt,
}: {
  days: Athlete["days"];
  metric: MetricKey;
  opts?: Parameters<typeof metricDelta>[2];
  fmt?: (n: number) => string;
}) {
  const v = latest(days, metric);
  const d = metricDelta(days, metric, opts);
  return (
    <span className="mv">
      {v == null ? "—" : fmt ? fmt(v) : v}
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
            <th className="n hide-sm">סטרס</th>
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
                  <Link href={`/athletes/${a.id}`} className="who" style={{ color: "inherit" }}>
                    <span className={`sdot ${b}`} />
                    <span>
                      <span className="nm" style={{ display: "block" }}>{a.name}</span>
                      <span className="fc">{a.focus || "—"}</span>
                    </span>
                  </Link>
                </td>
                <td className="n hide-sm">
                  <Cell days={a.days} metric="sleepHours" opts={{ decimals: 1 }} fmt={(n) => n.toFixed(1)} />
                </td>
                <td className="n hide-sm">
                  <Cell days={a.days} metric="hrv" opts={{ pct: true }} />
                </td>
                <td className="n hide-sm">
                  <Cell days={a.days} metric="rhr" opts={{ invert: true }} />
                </td>
                <td className="n hide-sm">
                  <Cell days={a.days} metric="stressAvg" opts={{ invert: true }} />
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
