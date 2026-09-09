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

export function CheckinForm() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

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
        שתי דקות. עוזר לי להתאים לך את האימון של היום.{" "}
        <span className="demo-tag">דמו — לא נשמר</span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setDone(true);
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
              <label htmlFor="hours">
                שעות שינה <span className="hint">(משוער)</span>
              </label>
              <input
                type="number"
                id="hours"
                step="0.25"
                min="0"
                max="14"
                placeholder="7.5"
              />
            </div>
            <div>
              <label htmlFor="weight">
                משקל בוקר <span className="hint">(ק״ג, לא חובה)</span>
              </label>
              <input type="number" id="weight" step="0.1" placeholder="—" />
            </div>
          </div>
        </div>

        <div className="field">
          <label htmlFor="ate">
            מה אכלת אתמול?{" "}
            <span className="hint">(בגדול — ארוחות עיקריות, שתייה, חטיפים)</span>
          </label>
          <textarea id="ate" rows={3} placeholder={"בוקר: ...\nצהריים: ...\nערב: ..."} />
        </div>

        <div className="field">
          <label htmlFor="note">
            משהו שכדאי שאדע?{" "}
            <span className="hint">(פציעה, מחלה, לילה קשה, נסיעה...)</span>
          </label>
          <textarea id="note" rows={2} placeholder="לא חובה" />
        </div>

        <button type="submit" className="submit">
          שליחת צ׳ק-אין
        </button>
      </form>
    </div>
  );
}
