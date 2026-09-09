import type { ReactNode } from "react";
import { requireCoach } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { signOut } from "@/app/login/actions";

export default async function DashLayout({ children }: { children: ReactNode }) {
  const coach = await requireCoach();

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <h1>מוקד בוקר</h1>
          <div className="sub">
            מחובר כ־<b>{coach.name}</b>
          </div>
        </div>
        <div className="topbar-actions">
          <Nav />
          <form action={signOut}>
            <button type="submit" className="linkbtn">
              יציאה
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
