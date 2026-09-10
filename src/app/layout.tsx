import type { Metadata } from "next";
import { Assistant } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/branding";

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "כלי ליווי יומי למאמן — מוכנוּת, צ׳ק-אין ומעקב ארוך-טווח אחרי המתאמנים",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={assistant.variable}>
      <body>{children}</body>
    </html>
  );
}
