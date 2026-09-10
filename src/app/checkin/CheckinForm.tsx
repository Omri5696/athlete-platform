"use client";

import { useState } from "react";
import type { Question } from "@/lib/questionnaire";

interface Props {
  questions: Question[];
  submitAction: (values: Record<string, string>) => Promise<{ error?: string } | void>;
  greetingName?: string;
  demo?: boolean;
}

export function CheckinForm({ questions, submitAction, greetingName, demo }: Props) {
  const [scales, setScales] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (done) {
    return (
      <div className="form-wrap">
        <div className="thanks">
          <div className="big">✓</div>
          <h1>נשלח, תודה!</h1>
          <p>
            סיכמתי. אם משהו חריג — אעדכן אותך לפני האימון.
            <br />
            נתראה מחר בבוקר 🙌
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-wrap">
      <h1>צ׳ק-אין יומי</h1>
      <div className="fsub">
        {greetingName ? `בוקר טוב, ${greetingName}. ` : ""}שתי דקות. עוזר למאמן
        להתאים לך את האימון של היום.
        {demo && (
          <span className="pill plain" style={{ marginInlineStart: 8 }}>
            דמו — לא נשמר
          </span>
        )}
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          const fd = new FormData(e.currentTarget);
          const values: Record<string, string> = {};
          for (const [k, v] of fd.entries()) values[k] = String(v);
          for (const [k, v] of Object.entries(scales)) values[k] = String(v);

          setPending(true);
          const res = await submitAction(values);
          setPending(false);
          if (res && "error" in res && res.error) setError(res.error);
          else setDone(true);
        }}
      >
        {questions.map((q) => (
          <div className="q" key={q.id}>
            {q.kind === "scale" && (
              <>
                <label>{q.label}</label>
                <div className="scale" role="group" aria-label={q.label}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      aria-pressed={scales[q.key] === n}
                      onClick={() => setScales((s) => ({ ...s, [q.key]: n }))}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {(q.lowLabel || q.highLabel) && (
                  <div className="scale-ends">
                    <span>{q.lowLabel}</span>
                    <span>{q.highLabel}</span>
                  </div>
                )}
              </>
            )}

            {q.kind === "number" && (
              <label className="fld">
                <span>{q.label}</span>
                <input className="input" type="number" name={q.key} step="0.1" inputMode="decimal" />
              </label>
            )}

            {q.kind === "text" && (
              <label className="fld">
                <span>{q.label}</span>
                <textarea className="input" name={q.key} rows={2} />
              </label>
            )}

            {q.kind === "boolean" && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <input type="checkbox" name={q.key} value="yes" />
                {q.label}
              </label>
            )}
          </div>
        ))}

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="submit" disabled={pending}>
          {pending ? "שולח…" : "שליחת צ׳ק-אין"}
        </button>
      </form>
    </div>
  );
}
