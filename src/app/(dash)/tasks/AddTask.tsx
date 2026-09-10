"use client";

import { useActionState, useRef } from "react";
import { addTask, type TaskState } from "./actions";

export function AddTask({
  athletes,
}: {
  athletes: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<TaskState, FormData>(
    async (prev, fd) => {
      const res = await addTask(prev, fd);
      if (!res.error) formRef.current?.reset();
      return res;
    },
    {},
  );

  return (
    <form ref={formRef} action={action}>
      <div className="addbar">
        <input
          className="input"
          name="title"
          placeholder="משימה חדשה…"
          required
          autoComplete="off"
        />
        <select className="input" name="athleteId" defaultValue="">
          <option value="">ללא מתאמן</option>
          {athletes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <input className="input" type="date" name="dueDate" />
        <button className="btn primary" type="submit" disabled={pending}>
          הוספה
        </button>
      </div>
      {state.error && <p className="form-error">{state.error}</p>}
    </form>
  );
}
