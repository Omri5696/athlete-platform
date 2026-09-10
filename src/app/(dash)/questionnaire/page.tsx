import { getAllQuestions } from "@/lib/questionnaire";
import { toggleQuestion, moveQuestion, deleteQuestion } from "./actions";
import { AddQuestion } from "./AddQuestion";

export const dynamic = "force-dynamic";
export const metadata = { title: "שאלון בוקר — קשב" };

const KIND_LABEL: Record<string, string> = {
  scale: "סולם 1–5",
  number: "מספר",
  text: "טקסט",
  boolean: "כן / לא",
};

export default async function QuestionnairePage() {
  const all = await getAllQuestions();
  const daily = all.filter((q) => q.form === "daily");

  return (
    <>
      <div className="page-head">
        <h1>שאלון בוקר</h1>
        <p className="sub">
          מה כל מתאמן ממלא בקישור האישי שלו. השינויים משפיעים על הצ׳ק-אין הבא.
        </p>
      </div>

      <AddQuestion />

      {daily.length === 0 ? (
        <div className="empty">אין שאלות. הוסף אחת למעלה.</div>
      ) : (
        <div className="list">
          {daily.map((q, i) => (
            <div className="li" key={q.id}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <form action={moveQuestion}>
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button className="btn ghost sm" type="submit" disabled={i === 0} aria-label="למעלה">↑</button>
                </form>
                <form action={moveQuestion}>
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button className="btn ghost sm" type="submit" disabled={i === daily.length - 1} aria-label="למטה">↓</button>
                </form>
              </div>
              <div className="grow">
                <div className="t" style={{ opacity: q.active ? 1 : 0.45 }}>
                  {q.label}
                </div>
                <div className="meta">
                  <span>{KIND_LABEL[q.kind]}</span>
                  {q.kind === "scale" && q.invert && <span>גבוה = רע</span>}
                  {!q.active && <span>לא פעיל</span>}
                </div>
              </div>
              <div className="acts">
                <form action={toggleQuestion}>
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="active" value={String(q.active)} />
                  <button className="btn ghost sm" type="submit">
                    {q.active ? "השבתה" : "הפעלה"}
                  </button>
                </form>
                <form action={deleteQuestion}>
                  <input type="hidden" name="id" value={q.id} />
                  <button className="btn ghost sm danger" type="submit">מחיקה</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
