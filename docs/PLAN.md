# תוכנית בנייה — Athlete Platform

## שלב 0 — יסודות ✅

- [x] שלד Next.js 16 + TypeScript + Tailwind
- [x] git init + commit ראשון
- [x] GitHub repo + push (`git@github.com:Omri5696/athlete-platform.git`)
- [x] חיבור Vercel — דיפלוי אוטומטי בכל push (`athlete-platform-seven.vercel.app`)
- [ ] פרויקט Supabase + חיבור מקומי (`.env.local`)

## שלב 0.5 — המסכים עם נתוני דמה ✅

- [x] דשבורד "מוקד בוקר" (`/`) — מיון לפי דחיפוּת, סיכום, כרטיסי מתאמן
- [x] דף מתאמן (`/athletes/[id]`) — גרפי 7 ימים + צ׳ק-אין
- [x] טופס צ׳ק-אין (`/checkin`) — עדיין לא נשמר
- [x] מערכת עיצוב ב-`globals.css` (טוקנים מהפרוטוטייפ), רכיבים ב-`src/components/`
- [x] לוגיקת ציון מוכנוּת ב-`src/lib/readiness.ts`, נתוני דמה ב-`src/lib/demo-data.ts`

## שלב 1 — שמיש בלי גרמין

המטרה: המאמן משתמש בזה כל בוקר, גם אם הנתונים מוזנים ידנית.

- [x] סכימת DB: `coaches`, `athletes`, `daily_metrics`, `daily_checkins` + RLS (`supabase/migrations/0001_init.sql`)
- [x] הדשבורד ודף המתאמן קוראים מ-DB (`src/lib/athletes.ts`); seed של 10 מתאמנים (`scripts/seed.ts`)
- [ ] הגדרת 3 משתני סביבה ב-Vercel (אחרת הפרודקשן ריק)
- [ ] Auth למאמן (Supabase Auth) — כרגע קוראים עם service-role בהנחת מאמן יחיד
- [ ] דף צ׳ק-אין ציבורי לכל מתאמן (`/checkin/[token]`) — כרגע `/checkin` הוא דמו שלא נשמר
- [ ] הזנה ידנית של נתוני שעון (טופס למאמן) עד שגרמין מחובר
- [ ] Vercel Cron יומי 06:00 → שליחת מייל עם קישור צ׳ק-אין אישי (Resend)

## שלב 2 — נתוני גרמין אוטומטיים

- [ ] בחירה Terra מול Vital + חשבון
- [ ] זרימת "חבר את גרמין" למתאמן (OAuth דרך המצרף)
- [ ] webhook endpoint → כתיבת שינה / HRV / RHR / Body Battery ל-`daily_metrics`
- [ ] כיול נוסחת ציון המוכנוּת מול נתונים אמיתיים

## שלב 3 — ליטוש

- [ ] WhatsApp במקום מייל (Twilio / 360dialog — דורש אישור תבניות מ-Meta)
- [ ] Sentry
- [ ] מדיניות פרטיות + מחיקת מתאמן
- [ ] התראות למאמן על מתאמן ב"אדום" מספר ימים ברצף

## נוסחת ציון מוכנוּת (טיוטה מהפרוטוטייפ)

```
score = 72
      + (HRV_today − HRV_baseline7) / HRV_baseline7 * 115
      − (RHR_today − RHR_baseline7) / RHR_baseline7 * 170
      + (sleep_hours − 7) * 7
      + [אם מולא צ׳ק-אין]:
          (energy − 3) * 3.5 + (3 − soreness) * 2.5
          + (3 − stress) * 2.5 + (sleep_quality − 3) * 3

ירוק ≥ 70 · צהוב 50–69 · אדום < 50
```

baseline = ממוצע 6 הימים שקדמו להיום. לכיול בשלב 2.
