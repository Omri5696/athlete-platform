"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type FormState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    signIn,
    {},
  );

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="next" value={next} />

      {state.error && <p className="form-error">{state.error}</p>}

      <label className="fld">
        <span>אימייל</span>
        <input
          className="input"
          type="email"
          name="email"
          autoComplete="username"
          required
        />
      </label>

      <label className="fld">
        <span>סיסמה</span>
        <input
          className="input"
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>

      <button type="submit" className="submit" disabled={pending}>
        {pending ? "מתחבר…" : "כניסה"}
      </button>

      <Link href="/auth/forgot" className="auth-alt">
        שכחתי סיסמה
      </Link>
    </form>
  );
}
