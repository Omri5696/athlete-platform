"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME, Logo } from "@/lib/branding";
import { signOut } from "@/app/login/actions";

const NAV = [
  { href: "/", label: "דשבורד", icon: IconGrid },
  { href: "/athletes", label: "מתאמנים", icon: IconUsers },
  { href: "/tasks", label: "משימות", icon: IconCheck },
  { href: "/questionnaire", label: "שאלון בוקר", icon: IconForm },
  { href: "/bloodwork", label: "בדיקות דם", icon: IconDrop },
  { href: "/settings", label: "הגדרות", icon: IconGear },
];

export function Sidebar({ coachName }: { coachName: string }) {
  const pathname = usePathname();

  return (
    <nav className="sidebar">
      <div className="brand">
        <Logo size={19} />
        <span className="name">{APP_NAME}</span>
      </div>

      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/" || pathname.startsWith("/athletes/")
            : pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="navlink"
            aria-current={active ? "page" : undefined}
          >
            <Icon />
            <span className="lbl">{item.label}</span>
          </Link>
        );
      })}

      <div className="spacer" />

      <div className="foot">
        <div className="coach">
          מחובר כ־<b>{coachName}</b>
        </div>
        <form action={signOut}>
          <button type="submit">יציאה</button>
        </form>
      </div>
    </nav>
  );
}

/* --- icons (16px, currentColor) --- */
function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 13c0-2.2 1.8-3.6 4-3.6S10 10.8 10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 4.2A2.2 2.2 0 0 1 11 8.5M12 12.6c0-1.6-.6-2.7-1.7-3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8.2l2 2 4-4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconForm() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 6h4M6 9h4M6 12h2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconDrop() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2.5S3.5 7.2 3.5 10a4.5 4.5 0 0 0 9 0C12.5 7.2 8 2.5 8 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
