import Link from "next/link";
import { notFound } from "next/navigation";
import { getPanel } from "@/lib/bloodwork";
import { deleteMarker, deletePanel } from "../actions";
import { AddMarker } from "./AddMarker";
import { AnalyzeButton } from "./AnalyzeButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "בדיקת דם — קשב" };

const HE = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" });
const HE_DT = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function PanelPage({ params }: PageProps<"/bloodwork/[panelId]">) {
  const { panelId } = await params;
  const panel = await getPanel(panelId);
  if (!panel) notFound();

  return (
    <>
      <Link href="/bloodwork" className="back-link">← חזרה לבדיקות דם</Link>
      <div className="detail-head">
        <div>
          <div className="name">{panel.athleteName}</div>
          <div className="focus">
            {HE.format(new Date(panel.drawnOn))}
            {panel.lab ? ` · ${panel.lab}` : ""}
            {panel.fasting ? " · בצום" : ""}
          </div>
        </div>
        <form action={deletePanel}>
          <input type="hidden" name="id" value={panel.id} />
          <button className="btn ghost sm danger" type="submit">מחיקת בדיקה</button>
        </form>
      </div>

      {panel.notes && (
        <div className="note" style={{ marginBottom: 14 }}>
          <div className="nl">הערות</div>
          {panel.notes}
        </div>
      )}

      <div className="panel">
        <h2>תוצאות</h2>
        {panel.markers.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>אין תוצאות. הוסף למטה.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="mtable">
              <thead>
                <tr>
                  <th>סמן</th>
                  <th>ערך</th>
                  <th>יחידה</th>
                  <th>טווח</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {panel.markers.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td className={m.outOfRange ? "out" : ""}>
                      {m.value ?? m.textValue ?? "—"}
                    </td>
                    <td>{m.unit ?? "—"}</td>
                    <td className="muted">
                      {m.refLow ?? "?"}–{m.refHigh ?? "?"}
                    </td>
                    <td>
                      <form action={deleteMarker}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="panelId" value={panel.id} />
                        <button className="btn ghost sm" type="submit">✕</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddMarker panelId={panel.id} />

      <div style={{ marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <p className="section-title" style={{ margin: 0 }}>ניתוח AI</p>
          <AnalyzeButton panelId={panel.id} hasAnalysis={!!panel.analysis} />
        </div>
        {panel.analysis ? (
          <div className="ai-box">
            {panel.analysis.summary}
            <span className="disc">
              נוצר {HE_DT.format(new Date(panel.analysis.createdAt))}
              {panel.analysis.model ? ` · ${panel.analysis.model}` : ""}
            </span>
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 13 }}>
            הוסף תוצאות ולחץ &quot;נתח עם AI&quot; לקבלת סיכום. אינו תחליף לרופא.
          </p>
        )}
      </div>
    </>
  );
}
