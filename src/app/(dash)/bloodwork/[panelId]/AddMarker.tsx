"use client";

import { useActionState, useRef } from "react";
import { addMarker, type BwState } from "../actions";

export function AddMarker({ panelId }: { panelId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<BwState, FormData>(
    async (prev, fd) => {
      const res = await addMarker(prev, fd);
      if (res.ok) formRef.current?.reset();
      return res;
    },
    {},
  );

  return (
    <form ref={formRef} action={action} className="card" style={{ marginTop: 14 }}>
      <p className="section-title">הוספת תוצאה</p>
      {state.error && <p className="form-error">{state.error}</p>}
      <input type="hidden" name="panelId" value={panelId} />
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.7fr 0.7fr 0.7fr", gap: 8 }}>
        <input className="input" name="name" placeholder="שם (למשל: פריטין)" required />
        <input className="input" name="value" placeholder="ערך" inputMode="decimal" />
        <input className="input" name="unit" placeholder="יחידה" />
        <input className="input" name="refLow" placeholder="טווח תחתון" inputMode="decimal" />
        <input className="input" name="refHigh" placeholder="טווח עליון" inputMode="decimal" />
      </div>
      <button className="btn primary sm" type="submit" disabled={pending} style={{ marginTop: 12 }}>
        הוספה
      </button>
    </form>
  );
}
