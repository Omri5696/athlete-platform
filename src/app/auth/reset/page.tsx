"use client";

import { useActionState } from "react";
import { updatePassword, type FormState } from "@/app/login/actions";

export default function ResetPage() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updatePassword,
    {},
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>בחירת סיסמה</h1>
        <p className="auth-sub">הגדר סיסמה חדשה לחשבון</p>

        <form action={formAction} className="auth-form">
          <div className="field">
            <label htmlFor="password">סיסמה חדשה</label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <span className="hint">לפחות 8 תווים</span>
          </div>

          <div className="field">
            <label htmlFor="confirm">אימות סיסמה</label>
            <input
              type="password"
              id="confirm"
              name="confirm"
              autoComplete="new-password"
              required
            />
          </div>

          {state.error && <p className="form-error">{state.error}</p>}

          <button type="submit" className="submit" disabled={pending}>
            {pending ? "שומר…" : "שמירה וכניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}
