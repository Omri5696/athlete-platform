import type { Metadata } from "next";
import { Rubik, Heebo, IBM_Plex_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  weight: ["500", "600", "700"],
});
const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "מוקד בוקר — Athlete Platform",
  description: "דשבורד מוכנוּת יומי למאמן",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${rubik.variable} ${heebo.variable} ${plexMono.variable}`}
    >
      <body>
        <div className="page">
          <header className="topbar">
            <div className="brand">
              <h1>
                מוקד בוקר <span className="demo-tag">דמו</span>
              </h1>
              <div className="sub">
                נתוני דמה · טרם מחובר ל־Garmin ול־Supabase
              </div>
            </div>
            <Nav />
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
