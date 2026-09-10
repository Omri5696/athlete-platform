@AGENTS.md

# קשב — כלי ליווי אישי של עומרי

## מה זה

**כלי אישי של עומרי בלבד** לליווי 10 המתאמנים שלו. לא מוצר, לא SaaS, אין משתמשים
אחרים. המטרה: ליווי לונג׳ביטי — לקבל עדכון קבוע מכל מתאמן על המצב שלו (הרגשה, שינה,
עומס חיים, פציעות קטנות, מוטיבציה) ולראות את זה מצטבר לאורך זמן.

**לא TrainingPeaks.** עומרי בונה תוכניות אימון ב-TrainingPeaks. קשב משלים:
התוכנית שם, מצב המתאמן והקשר היומי כאן. אין כאן תכנון אימונים.

לכל מתאמן: (1) צ׳ק-אין סובייקטיבי דרך קישור אישי — הלב של הכלי; (2) נתוני שעון
(כרגע ידני; גרמין דרך Terra בהמשך). עומרי פותח דשבורד "קשב" — מתאמנים ממוינים
מהדחוף לרגוע, ציון מוכנוּת, סטטוס צ׳ק-אין; לחיצה → מגמות + תשובות הצ׳ק-אין.

עיצוב: נקי, "סטארטאפי"/הייטק, UX/UI טוב. ממשק בעברית, RTL. כיוון מלא ב-`docs/STRATEGY.md`.

## סטאק

| שכבה | בחירה |
|---|---|
| אפליקציה | Next.js 16 (App Router) + TypeScript |
| עיצוב | מערכת CSS-vars ב-`src/app/globals.css` (לא Tailwind — מותקן אך לא בשימוש) |
| DB / Auth | Supabase (Postgres) |
| אירוח | Vercel (דיפלוי אוטומטי בכל push ל-main) |
| מייל (בהמשך) | Resend + Vercel Cron |
| נתוני שעונים (בהמשך) | Terra |

## מצב נוכחי

Auth עובד (Supabase, email+password). כל המסכים בנויים; קוראים מ-DB (authed/RLS).
`/checkin/[token]` הציבורי שומר צ׳ק-אין. seed: 10 מתאמנים + 56 ימי היסטוריית מדדים.

**מנוע ניתוח** (`src/lib/analysis.ts`, שכבות 1–2 מ-`docs/ANALYSIS.md`): `Athlete`
מכיל `days: DayMetrics[]`; בייסליינים אישיים, ציוני תחום (התאוששות/עומס/תחושה),
`readinessScore` נבנה מהם. `flags.ts` = דפוסים רב-יומיים. `src/lib/demo-data.ts`
= פרופיל + "story" לכל מתאמן, `scripts/seed.ts` מייצר ממנו את ההיסטוריה.

הבא: יומן מאמן, ואז שכבות 3–4 מ-ANALYSIS.md (חוקי דפוסים + סקירת AI שבועית).
ראה `docs/PLAN.md`, `docs/STRATEGY.md`, `docs/ANALYSIS.md`. subagent `product-manager` להחלטות מוצר.

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
