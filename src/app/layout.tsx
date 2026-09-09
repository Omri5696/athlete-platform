import type { Metadata } from "next";
import { Heebo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "מוקד בוקר",
  description: "כלי ליווי יומי למאמן — מוכנוּת וצ׳ק-אין של המתאמנים",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
