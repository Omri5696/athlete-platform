"use client";

import { useActionState } from "react";
import { saveSettings, type SettingsState } from "./actions";

export function SettingsForm({
  name,
  greenAt,
  amberAt,
}: {
  name: string;
  greenAt: number;
  amberAt: number;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    saveSettings,
    {},
  );

  return (
    <form action={action}>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">נשמר.</p>}

      <div className="card" style={{ marginBottom: 14 }}>
        <p className="section-title">פרופיל</p>
        <label className="fld">
          <span>שם</span>
          <input className="input" name="name" defaultValue={name} required />
        </label>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="section-title">ספי ציון מוכנוּת</p>
        <p className="muted" style={{ fontSize: 13, marginTop: -4, marginBottom: 14 }}>
          מעל הסף הירוק = &quot;מוכן&quot;. בין הספים = &quot;במעקב&quot;. מתחת לצהוב = &quot;בסיכון&quot;.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label className="fld">
            <span>סף ירוק (מוכן)</span>
            <input className="input" type="number" name="greenAt" defaultValue={greenAt} min={1} max={99} required />
          </label>
          <label className="fld">
            <span>סף צהוב (במעקב)</span>
            <input className="input" type="number" name="amberAt" defaultValue={amberAt} min={1} max={98} required />
          </label>
        </div>
      </div>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "שומר…" : "שמירה"}
      </button>
    </form>
  );
}
