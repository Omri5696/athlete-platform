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

      <div className="field">
        <label htmlFor="email">אימייל</label>
        <input type="email" id="email" name="email" autoComplete="username" required />
      </div>

      <div className="field">
        <label htmlFor="password">סיסמה</label>
        <input
          type="password"
          id="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state.error && <p className="form-error">{state.error}</p>}

      <button type="submit" className="submit" disabled={pending}>
        {pending ? "מתחבר…" : "כניסה"}
      </button>

      <Link href="/auth/forgot" className="auth-alt">
        שכחתי סיסמה
      </Link>
    </form>
  );
}
