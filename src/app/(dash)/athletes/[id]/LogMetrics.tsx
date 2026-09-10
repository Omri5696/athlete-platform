"use client";

import { useActionState, useRef, useState } from "react";
import { logDay, type ManageState } from "../actions";

const CORE: { name: string; label: string; step?: string; ph?: string }[] = [
  { name: "hrv", label: "HRV (מ״ש)" },
  { name: "rhr", label: "דופק מנוחה" },
  { name: "sleepHours", label: "שעות שינה", step: "0.25", ph: "7.5" },
  { name: "sleepScore", label: "ציון שינה" },
  { name: "bodyBattery", label: "Body Battery בוקר" },
  { name: "stressAvg", label: "סטרס יומי (ממוצע)" },
  { name: "respiration", label: "קצב נשימה", step: "0.5" },
  { name: "steps", label: "צעדים" },
  { name: "load", label: "עומס אימון (TL)" },
  { name: "weightKg", label: "משקל בוקר (ק״ג)", step: "0.1" },
];

const ADVANCED: { name: string; label: string; step?: string }[] = [
  { name: "spo2Avg", label: "SpO2 לילי (%)" },
  { name: "activeMin", label: "דקות פעילות" },
  { name: "atl", label: "עומס אקוטי (ATL)" },
  { name: "ctl", label: "עומס כרוני (CTL)" },
  { name: "trainingReadiness", label: "Garmin Readiness" },
  { name: "vo2max", label: "VO₂max", step: "0.1" },
  { name: "sleepDeepMin", label: "שינה עמוקה (דק׳)" },
  { name: "sleepRemMin", label: "REM (דק׳)" },
];

export function LogMetrics({
  athleteId,
  lastDate,
}: {
  athleteId: string;
  lastDate: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [adv, setAdv] = useState(false);
  const [state, action, pending] = useActionState<ManageState, FormData>(
    async (prev, fd) => {
      const res = await logDay(prev, fd);
      if (res.ok) formRef.current?.reset();
      return res;
    },
    {},
  );

  const today = new Date().toISOString().slice(0, 10);

  if (!open) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" className="btn primary" onClick={() => setOpen(true)}>
          הזנת נתוני יום
        </button>
        <span className="muted" style={{ fontSize: 12.5 }}>
          {lastDate ? `עדכון אחרון: ${lastDate}` : "אין עדיין נתונים"}
        </span>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="athleteId" value={athleteId} />
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">נשמר.</p>}

      <label className="fld" style={{ maxWidth: 200, marginBottom: 14 }}>
        <span>תאריך</span>
        <input className="input" type="date" name="date" defaultValue={today} max={today} required />
      </label>

      <div className="metric-grid">
        {CORE.map((f) => (
          <label className="fld" key={f.name}>
            <span>{f.label}</span>
            <input className="input" type="number" name={f.name} step={f.step ?? "1"} placeholder={f.ph} inputMode="decimal" />
          </label>
        ))}
        <label className="fld">
          <span>שעת שינה</span>
          <input className="input" type="time" name="bedtime" />
        </label>
        <label className="fld">
          <span>שעת קימה</span>
          <input className="input" type="time" name="wakeTime" />
        </label>
      </div>

      <button type="button" className="btn ghost sm" onClick={() => setAdv((v) => !v)} style={{ marginTop: 10 }}>
        {adv ? "פחות שדות" : "עוד שדות"}
      </button>

      {adv && (
        <div className="metric-grid" style={{ marginTop: 12 }}>
          {ADVANCED.map((f) => (
            <label className="fld" key={f.name}>
              <span>{f.label}</span>
              <input className="input" type="number" name={f.name} step={f.step ?? "1"} inputMode="decimal" />
            </label>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button className="btn primary" type="submit" disabled={pending}>
          {pending ? "שומר…" : "שמירה"}
        </button>
        <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
          סגירה
        </button>
      </div>
    </form>
  );
}
