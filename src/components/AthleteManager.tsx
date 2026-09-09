"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { AthleteAdmin } from "@/lib/athletes";
import {
  addAthlete,
  updateAthlete,
  archiveAthlete,
  type ManageState,
} from "@/app/(dash)/manage/actions";

function AddForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState<ManageState, FormData>(
    async (prev, fd) => {
      const res = await addAthlete(prev, fd);
      if (res.ok) onDone();
      return res;
    },
    {},
  );

  return (
    <form action={action} className="inline-form">
      <div className="field">
        <label htmlFor="add-name">שם</label>
        <input id="add-name" name="name" required autoFocus />
      </div>
      <div className="field">
        <label htmlFor="add-focus">מיקוד אימון</label>
        <input id="add-focus" name="focus" placeholder="מרתון · שבוע עומס" />
      </div>
      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? "מוסיף…" : "הוספה"}
      </button>
      {state.error && (
        <p className="form-error" style={{ gridColumn: "1 / -1" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}

function EditForm({
  athlete,
  onDone,
}: {
  athlete: AthleteAdmin;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<ManageState, FormData>(
    async (prev, fd) => {
      const res = await updateAthlete(prev, fd);
      if (res.ok) onDone();
      return res;
    },
    {},
  );

  return (
    <form action={action} className="inline-form">
      <input type="hidden" name="id" value={athlete.id} />
      <div className="field">
        <label>שם</label>
        <input name="name" defaultValue={athlete.name} required autoFocus />
      </div>
      <div className="field">
        <label>מיקוד אימון</label>
        <input name="focus" defaultValue={athlete.focus} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button type="submit" className="btn primary" disabled={pending}>
          שמירה
        </button>
        <button type="button" className="btn" onClick={onDone}>
          ביטול
        </button>
      </div>
      {state.error && (
        <p className="form-error" style={{ gridColumn: "1 / -1" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="link-field">
      <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
      <button
        type="button"
        className="btn sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked — the field is selectable as a fallback */
          }
        }}
      >
        {copied ? "הועתק ✓" : "העתקת קישור"}
      </button>
    </div>
  );
}

function Row({ athlete, origin }: { athlete: AthleteAdmin; origin: string }) {
  const [editing, setEditing] = useState(false);
  const checkinUrl = `${origin}/checkin/${athlete.checkinToken}`;

  if (editing) {
    return <EditForm athlete={athlete} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="athlete-row">
      <div className="who">
        <div className="rn">
          <Link
            href={`/athletes/${athlete.id}`}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {athlete.name}
          </Link>
        </div>
        <div className="rf">{athlete.focus || "—"}</div>
      </div>

      <div className="row-actions">
        <span className={`tag ${athlete.hasCheckinToday ? "on" : "off"}`}>
          {athlete.hasCheckinToday ? "צ׳ק-אין היום" : "אין צ׳ק-אין"}
        </span>
        <span className={`tag ${athlete.garminLinked ? "on" : "off"}`}>
          {athlete.garminLinked ? "גרמין מחובר" : "גרמין לא מחובר"}
        </span>
        <button type="button" className="btn sm" onClick={() => setEditing(true)}>
          עריכה
        </button>
        <form
          action={archiveAthlete}
          onSubmit={(e) => {
            if (!confirm(`להעביר את ${athlete.name} לארכיון?`))
              e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={athlete.id} />
          <button type="submit" className="btn sm danger">
            ארכיון
          </button>
        </form>
      </div>

      <CopyLink url={checkinUrl} />
    </div>
  );
}

export function AthleteManager({
  athletes,
  origin,
}: {
  athletes: AthleteAdmin[];
  origin: string;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <section>
      <div className="manage-head">
        <div>
          <h2>ניהול מתאמנים</h2>
          <span className="count">{athletes.length} פעילים</span>
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={() => setAdding((v) => !v)}
        >
          {adding ? "סגירה" : "הוספת מתאמן"}
        </button>
      </div>

      {adding && <AddForm onDone={() => setAdding(false)} />}

      {athletes.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "32px" }}>
          עדיין אין מתאמנים. לחץ &quot;הוספת מתאמן&quot; כדי להתחיל.
        </div>
      ) : (
        <div className="athlete-rows">
          {athletes.map((a) => (
            <Row key={a.id} athlete={a} origin={origin} />
          ))}
        </div>
      )}
    </section>
  );
}
