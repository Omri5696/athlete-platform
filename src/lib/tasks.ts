import "server-only";
import { createClient } from "./supabase/server";
import { requireCoach } from "./auth";

export interface Task {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null;
  athleteId: string | null;
  athleteName: string | null;
}

interface TaskRow {
  id: string;
  title: string;
  done: boolean;
  due_date: string | null;
  athlete_id: string | null;
  athletes: { name: string } | null;
}

function toTask(r: TaskRow): Task {
  return {
    id: r.id,
    title: r.title,
    done: r.done,
    dueDate: r.due_date,
    athleteId: r.athlete_id,
    athleteName: r.athletes?.name ?? null,
  };
}

export async function getTasks(): Promise<Task[]> {
  await requireCoach();
  const db = await createClient();
  const { data, error } = await db
    .from("tasks")
    .select("id, title, done, due_date, athlete_id, athletes(name)")
    .order("done")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<TaskRow[]>();
  if (error) throw error;
  return (data ?? []).map(toTask);
}

export async function getOpenTasks(): Promise<Task[]> {
  const all = await getTasks();
  return all.filter((t) => !t.done);
}
