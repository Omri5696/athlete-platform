import type { ReactNode } from "react";
import { requireCoach } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const coach = await requireCoach();

  return (
    <div className="app">
      <Sidebar coachName={coach.name} />
      <main className="app-main">{children}</main>
    </div>
  );
}
