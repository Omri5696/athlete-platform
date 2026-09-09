@AGENTS.md

# Athlete Platform — פלטפורמת ניטור מוכנוּת למאמן

## מה זה

מערכת שבה מאמן עוקב אחרי קבוצת מתאמנים (מתחילים עם ~10). לכל מתאמן:

1. **נתונים אובייקטיביים** — נמשכים אוטומטית משעון גרמין דרך מצרף wearables (Terra / Vital):
   שינה, HRV, דופק מנוחה, Body Battery, עומס אימון, steps.
2. **צ׳ק-אין סובייקטיבי יומי** — טופס קצר שהמתאמן ממלא כל בוקר (איכות שינה, אנרגיה, מצב רוח,
   כאבי שרירים, לחץ, שעות שינה, משקל, תזונה, הערות).

המאמן פותח **דשבורד "מוקד בוקר"** — כל המתאמנים מסודרים מהדחוף לרגוע, עם ציון מוכנוּת,
מדדי מפתח, וסטטוס צ׳ק-אין. לחיצה על מתאמן → גרפים של 7 ימים + תשובות הצ׳ק-אין.
כל בוקר נשלח לכל מתאמן קישור אישי לצ׳ק-אין (מייל בשלב ראשון, WhatsApp בהמשך).

הממשק בעברית, RTL.

## סטאק

| שכבה | בחירה |
|---|---|
| אפליקציה | Next.js 16 (App Router) + TypeScript + Tailwind v4 |
| DB / Auth / Storage | Supabase (Postgres) |
| נתוני שעונים | Terra או Vital (webhooks) |
| מייל | Resend |
| תזמון | Vercel Cron |
| אירוח | Vercel |
| ניטור | Sentry |

## מצב נוכחי

השלב: **1**. שלושת המסכים בנויים. Supabase מחובר: הדשבורד (`/`) ודף המתאמן
(`/athletes/[id]`) קוראים מ-DB דרך `src/lib/athletes.ts`. הסכימה ב-
`supabase/migrations/0001_init.sql`, seed ב-`scripts/seed.ts` (10 מתאמנים,
המאמן: `omricohen5696@gmail.com`).

עדיין אין login — קוראים עם `createAdminClient()` (service-role, עוקף RLS)
בהנחת מאמן יחיד. `/checkin` הוא עדיין דמו שלא נשמר. נתוני השעון מוזנים כ-`source: 'manual'`.

הבא: (1) 3 משתני סביבה ב-Vercel, (2) Supabase Auth למאמן. ראה `docs/PLAN.md`.

## מפתחות וסביבה

- `.env.local` (gitignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (publishable), `SUPABASE_SERVICE_ROLE_KEY` (secret), `SUPABASE_ACCESS_TOKEN`
  (personal token — local tooling only). תבנית ב-`.env.example`.
- שלושת ה-`SUPABASE_*` הראשונים (לא ה-ACCESS_TOKEN) מוגדרים גם ב-Vercel.
- הרצת סקריפט: `set -a && . ./.env.local && set +a && npx tsx scripts/<x>.ts`
- מיגרציות: `npx tsx scripts/db.ts supabase/migrations/<file>.sql` (Management API, לא SQL editor)
- קישור הגדרת סיסמה למאמן: `npx tsx scripts/coach-link.ts [email] [--local]`

## Auth

Supabase Auth (email+password). `proxy.ts` → `src/lib/supabase/middleware.ts` מרענן
session ומפנה ל-`/login`; כל page/action מוגן קורא `requireCoach()` (`src/lib/auth.ts`).
דפי המאמן תחת `src/app/(dash)/` (route group, layout עם header+guard). ציבורי:
`/login`, `/auth/*`, `/checkin`, `/checkin/[token]`. קריאות מ-`src/lib/athletes.ts`
עברו ל-authed client (RLS), לא admin. הצ׳ק-אין הציבורי (`/checkin/[token]`) שומר ל-DB
דרך admin client עם אימות token.

## מוסכמות

- קוד וקומיטים באנגלית; טקסט מול המשתמש (UI, מיילים) בעברית.
- Next.js 16 — יש breaking changes מול גרסאות קודמות. לפני כתיבת קוד, קרא את המדריך
  הרלוונטי ב־`node_modules/next/dist/docs/`.
- סוד/מפתח לא נכנס ל־git. משתנים ב־`.env.local` (מקומי) ובהגדרות Vercel (פרודקשן).
- מידע בריאותי — הסכמה מפורשת מכל מתאמן, ומחיקה לפי בקשה.
