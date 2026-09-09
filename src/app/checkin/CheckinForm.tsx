"use client";

import { useState } from "react";

const FIELDS = [
  { key: "sleepQuality", label: "איך ישנת הלילה?", lo: "גרוע", hi: "מצוין" },
  { key: "energy", label: "רמת האנרגיה עכשיו", lo: "אפס", hi: "מלא/ה" },
  { key: "mood", label: "מצב רוח", lo: "נמוך", hi: "מרומם" },
  { key: "soreness", label: "כאבי שרירים / נוקשות", lo: "אין", hi: "חזק מאוד" },
  {
    key: "stress",
    label: "עומס נפשי / לחץ מחוץ לאימונים",
    lo: "רגוע",
    hi: "מוצף/ת",
  },
] as const;

interface Props {
  /** when omitted, the form is a non-saving demo */
  submitAction?: (formData: FormData) => Promise<{ error?: string } | void>;
  greetingName?: string;
}

export function CheckinForm({ submitAction, greetingName }: Props) {
  const [scores, setScores] = useState<Record<string, number>>({});
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
        {!submitAction && <span className="demo-tag">דמו — לא נשמר</span>}
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          const formData = new FormData(e.currentTarget);
          for (const [k, v] of Object.entries(scores))
            formData.set(k, String(v));

          if (!submitAction) {
            setDone(true);
            return;
          }
          setPending(true);
          const res = await submitAction(formData);
          setPending(false);
          if (res && "error" in res && res.error) setError(res.error);
          else setDone(true);
        }}
      >
        {FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label>{f.label}</label>
            <div className="scale" role="group" aria-label={f.label}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  aria-pressed={scores[f.key] === n}
                  onClick={() => setScores((s) => ({ ...s, [f.key]: n }))}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="scale-ends">
              <span>{f.lo}</span>
              <span>{f.hi}</span>
            </div>
          </div>
        ))}

        <div className="field">
          <div className="row2">
            <div>
              <label htmlFor="sleepHours">
                שעות שינה <span className="hint">(משוער)</span>
              </label>
              <input
                type="number"
                id="sleepHours"
                name="sleepHours"
                step="0.25"
                min="0"
                max="14"
                placeholder="7.5"
              />
            </div>
            <div>
              <label htmlFor="weightKg">
                משקל בוקר <span className="hint">(ק״ג, לא חובה)</span>
              </label>
              <input
                type="number"
                id="weightKg"
                name="weightKg"
                step="0.1"
                placeholder="—"
              />
            </div>
          </div>
        </div>

        <div className="field">
          <label htmlFor="ate">
            מה אכלת אתמול?{" "}
            <span className="hint">(בגדול — ארוחות עיקריות, שתייה, חטיפים)</span>
          </label>
          <textarea
            id="ate"
            name="ate"
            rows={3}
            placeholder={"בוקר: ...\nצהריים: ...\nערב: ..."}
          />
        </div>

        <div className="field">
          <label htmlFor="note">
            משהו שכדאי שהמאמן יֵדע?{" "}
            <span className="hint">(פציעה, מחלה, לילה קשה, נסיעה...)</span>
          </label>
          <textarea id="note" name="note" rows={2} placeholder="לא חובה" />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="submit" disabled={pending}>
          {pending ? "שולח…" : "שליחת צ׳ק-אין"}
        </button>
      </form>
    </div>
  );
}
