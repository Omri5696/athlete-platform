"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { AthleteAdmin } from "@/lib/athletes";
import {
  addAthlete,
  updateAthlete,
  archiveAthlete,
  type ManageState,
} from "@/app/(dash)/athletes/actions";

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
    <form action={action} style={{ marginBottom: 14 }}>
      <div className="addbar">
        <input className="input" name="name" placeholder="שם המתאמן" required autoFocus />
        <input className="input" name="focus" placeholder="מיקוד אימון (למשל: מרתון)" />
        <button className="btn primary" type="submit" disabled={pending}>
          {pending ? "מוסיף…" : "הוספה"}
        </button>
      </div>
      {state.error && <p className="form-error">{state.error}</p>}
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
    <form action={action} className="li" style={{ display: "block" }}>
      <input type="hidden" name="id" value={athlete.id} />
      <div className="addbar" style={{ margin: 0 }}>
        <input className="input" name="name" defaultValue={athlete.name} required autoFocus />
        <input className="input" name="focus" defaultValue={athlete.focus} placeholder="מיקוד אימון" />
        <button className="btn primary" type="submit" disabled={pending}>
          שמירה
        </button>
        <button type="button" className="btn ghost" onClick={onDone}>
          ביטול
        </button>
      </div>
      {state.error && <p className="form-error" style={{ marginTop: 10 }}>{state.error}</p>}
    </form>
  );
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="addbar" style={{ margin: "8px 0 0" }}>
      <input
        className="input"
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        style={{ fontSize: 12 }}
      />
      <button
        type="button"
        className="btn sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* field is selectable as fallback */
          }
        }}
      >
        {copied ? "הועתק ✓" : "העתקה"}
      </button>
    </div>
  );
}

function Row({ athlete, origin }: { athlete: AthleteAdmin; origin: string }) {
  const [editing, setEditing] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const checkinUrl = `${origin}/checkin/${athlete.checkinToken}`;

  if (editing) return <EditForm athlete={athlete} onDone={() => setEditing(false)} />;

  return (
    <div className="li" style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="grow">
          <div className="t">
            <Link
              href={`/athletes/${athlete.id}`}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {athlete.name}
            </Link>
          </div>
          <div className="meta">
            <span>{athlete.focus || "—"}</span>
            <span className={`pill ${athlete.hasCheckinToday ? "ready" : "plain"}`}>
              <span className="dot" />
              {athlete.hasCheckinToday ? "צ׳ק-אין היום" : "אין צ׳ק-אין"}
            </span>
            {athlete.garminLinked && (
              <span className="pill plain">
                <span className="dot" />
                גרמין
              </span>
            )}
          </div>
        </div>
        <div className="acts">
          <button type="button" className="btn ghost sm" onClick={() => setShowLink((v) => !v)}>
            קישור צ׳ק-אין
          </button>
          <button type="button" className="btn ghost sm" onClick={() => setEditing(true)}>
            עריכה
          </button>
          <form
            action={archiveAthlete}
            onSubmit={(e) => {
              if (!confirm(`להעביר את ${athlete.name} לארכיון?`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={athlete.id} />
            <button type="submit" className="btn ghost sm danger">
              ארכיון
            </button>
          </form>
        </div>
      </div>
      {showLink && <CopyLink url={checkinUrl} />}
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
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button type="button" className="btn primary" onClick={() => setAdding((v) => !v)}>
          {adding ? "סגירה" : "הוספת מתאמן"}
        </button>
      </div>

      {adding && <AddForm onDone={() => setAdding(false)} />}

      {athletes.length === 0 ? (
        <div className="empty">אין מתאמנים. לחץ &quot;הוספת מתאמן&quot; כדי להתחיל.</div>
      ) : (
        <div className="list">
          {athletes.map((a) => (
            <Row key={a.id} athlete={a} origin={origin} />
          ))}
        </div>
      )}
    </>
  );
}
