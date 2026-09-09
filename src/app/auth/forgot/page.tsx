"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestReset, type FormState } from "@/app/login/actions";

export default function ForgotPage() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    requestReset,
    {},
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>איפוס סיסמה</h1>
        <p className="auth-sub">נשלח קישור לאימייל שלך</p>

        <form action={formAction} className="auth-form">
          <div className="field">
            <label htmlFor="email">אימייל</label>
            <input type="email" id="email" name="email" required />
          </div>

          {state.error && <p className="form-error">{state.error}</p>}
          {state.ok && <p className="form-ok">{state.ok}</p>}

          <button type="submit" className="submit" disabled={pending}>
            {pending ? "שולח…" : "שליחת קישור"}
          </button>

          <Link href="/login" className="auth-alt">
            חזרה לכניסה
          </Link>
        </form>
      </div>
    </div>
  );
}
