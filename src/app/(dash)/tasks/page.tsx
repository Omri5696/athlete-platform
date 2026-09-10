import { getTasks } from "@/lib/tasks";
import { getManagedAthletes } from "@/lib/athletes";
import { toggleTask, deleteTask } from "./actions";
import { AddTask } from "./AddTask";

export const dynamic = "force-dynamic";
export const metadata = { title: "משימות — קשב" };

const HE_DATE = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" });

export default async function TasksPage() {
  const [tasks, athletes] = await Promise.all([getTasks(), getManagedAthletes()]);
  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <>
      <div className="page-head">
        <h1>משימות</h1>
        <p className="sub">{open.length} פתוחות</p>
      </div>

      <AddTask athletes={athletes.map((a) => ({ id: a.id, name: a.name }))} />

      {tasks.length === 0 ? (
        <div className="empty">אין משימות. הוסף אחת למעלה.</div>
      ) : (
        <div className="list">
          {[...open, ...done].map((t) => (
            <div className="li" key={t.id}>
              <form action={toggleTask}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="done" value={String(t.done)} />
                <button
                  type="submit"
                  className={`check ${t.done ? "on" : ""}`}
                  aria-label={t.done ? "החזרה לפתוח" : "סימון כבוצע"}
                >
                  ✓
                </button>
              </form>
              <div className="grow">
                <div className={`t ${t.done ? "done" : ""}`}>{t.title}</div>
                {(t.athleteName || t.dueDate) && (
                  <div className="meta">
                    {t.athleteName && <span>{t.athleteName}</span>}
                    {t.dueDate && (
                      <span>{HE_DATE.format(new Date(t.dueDate))}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="acts">
                <form action={deleteTask}>
                  <input type="hidden" name="id" value={t.id} />
                  <button type="submit" className="btn ghost sm">
                    מחיקה
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
