"use client";

import { useActionState, useRef, useState } from "react";
import { addPanel, type BwState } from "./actions";

export function AddPanel({
  athletes,
}: {
  athletes: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<BwState, FormData>(
    async (prev, fd) => {
      const res = await addPanel(prev, fd);
      if (res.ok) {
        formRef.current?.reset();
        setOpen(false);
      }
      return res;
    },
    {},
  );

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" className="btn primary" onClick={() => setOpen((v) => !v)}>
          {open ? "סגירה" : "בדיקה חדשה"}
        </button>
      </div>

      {open && (
        <form ref={formRef} action={action} className="card" style={{ marginTop: 12 }}>
          {state.error && <p className="form-error">{state.error}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label className="fld">
              <span>מתאמן</span>
              <select className="input" name="athleteId" required defaultValue="">
                <option value="" disabled>בחר…</option>
                {athletes.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </label>
            <label className="fld">
              <span>תאריך הבדיקה</span>
              <input className="input" type="date" name="drawnOn" required />
            </label>
            <label className="fld">
              <span>מעבדה</span>
              <input className="input" name="lab" placeholder="לא חובה" />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, alignSelf: "end", paddingBottom: 9 }}>
              <input type="checkbox" name="fasting" /> בצום
            </label>
          </div>
          <label className="fld" style={{ marginTop: 12 }}>
            <span>הערות</span>
            <input className="input" name="notes" placeholder="לא חובה" />
          </label>
          <button className="btn primary" type="submit" disabled={pending} style={{ marginTop: 14 }}>
            {pending ? "מוסיף…" : "הוספה"}
          </button>
        </form>
      )}
    </div>
  );
}
