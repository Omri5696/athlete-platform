import type { Metadata } from "next";
import { IBM_Plex_Sans_Hebrew } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/branding";

const ui = IBM_Plex_Sans_Hebrew({
  variable: "--font-ui",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "כלי ליווי יומי למאמן — מוכנוּת, צ׳ק-אין ומעקב ארוך-טווח אחרי המתאמנים",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={ui.variable}>
      <body>{children}</body>
    </html>
  );
}
