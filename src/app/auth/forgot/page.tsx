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
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>איפוס סיסמה</h1>
        <p className="auth-sub">נשלח קישור לאימייל שלך</p>

        <form action={formAction} className="auth-form">
          {state.error && <p className="form-error">{state.error}</p>}
          {state.ok && <p className="form-ok">{state.ok}</p>}

          <label className="fld">
            <span>אימייל</span>
            <input className="input" type="email" name="email" required />
          </label>

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
