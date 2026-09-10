"use client";

import { useActionState, useRef, useState } from "react";
import { addQuestion, type QState } from "./actions";

export function AddQuestion() {
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState("scale");
  const [state, action, pending] = useActionState<QState, FormData>(
    async (prev, fd) => {
      const res = await addQuestion(prev, fd);
      if (!res.error) {
        formRef.current?.reset();
        setKind("scale");
      }
      return res;
    },
    {},
  );

  return (
    <form ref={formRef} action={action} className="card" style={{ marginBottom: 16 }}>
      <p className="section-title">שאלה חדשה</p>
      {state.error && <p className="form-error">{state.error}</p>}
      <div style={{ display: "grid", gap: 12 }}>
        <label className="fld">
          <span>הטקסט שהמתאמן יראה</span>
          <input className="input" name="label" placeholder="למשל: איך היו הרגליים היום?" required />
        </label>
        <label className="fld">
          <span>סוג תשובה</span>
          <select
            className="input"
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="scale">סולם 1–5</option>
            <option value="number">מספר</option>
            <option value="text">טקסט חופשי</option>
            <option value="boolean">כן / לא</option>
          </select>
        </label>
        {kind === "scale" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label className="fld">
                <span>תווית 1</span>
                <input className="input" name="lowLabel" placeholder="גרוע" />
              </label>
              <label className="fld">
                <span>תווית 5</span>
                <input className="input" name="highLabel" placeholder="מצוין" />
              </label>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input type="checkbox" name="invert" />
              ערך גבוה = רע (למשל כאב, לחץ)
            </label>
          </>
        )}
      </div>
      <button className="btn primary" type="submit" disabled={pending} style={{ marginTop: 14 }}>
        הוספת שאלה
      </button>
    </form>
  );
}
