# תוכנית בנייה — Athlete Platform

## שלב 0 — יסודות ✅

- [x] שלד Next.js 16 + TypeScript + Tailwind
- [x] git init + commit ראשון
- [x] GitHub repo + push (`git@github.com:Omri5696/athlete-platform.git`)
- [x] חיבור Vercel — דיפלוי אוטומטי בכל push (`athlete-platform-seven.vercel.app`)
- [ ] פרויקט Supabase + חיבור מקומי (`.env.local`)

## שלב 0.5 — המסכים עם נתוני דמה ✅

- [x] דשבורד "קשב" (`/`) — מיון לפי דחיפוּת, סיכום, כרטיסי מתאמן
- [x] דף מתאמן (`/athletes/[id]`) — גרפי 7 ימים + צ׳ק-אין
- [x] טופס צ׳ק-אין (`/checkin`) — עדיין לא נשמר
- [x] מערכת עיצוב ב-`globals.css` (טוקנים מהפרוטוטייפ), רכיבים ב-`src/components/`
- [x] לוגיקת ציון מוכנוּת ב-`src/lib/readiness.ts`, נתוני דמה ב-`src/lib/demo-data.ts`

## שלב 1 — שמיש בלי גרמין

המטרה: המאמן משתמש בזה כל בוקר, גם אם הנתונים מוזנים ידנית.

- [x] סכימת DB: `coaches`, `athletes`, `daily_metrics`, `daily_checkins` + RLS (`supabase/migrations/0001_init.sql`)
- [x] הדשבורד ודף המתאמן קוראים מ-DB (`src/lib/athletes.ts`); seed של 10 מתאמנים (`scripts/seed.ts`)
- [x] 3 משתני סביבה ב-Vercel
- [x] Auth למאמן (Supabase Auth) — login, proxy guard, `requireCoach()`; דפי מאמן ב-`(dash)/`
- [x] ניהול מתאמנים (`/manage`) — הוספה/עריכה/ארכיון + קישור צ׳ק-אין אישי
- [x] דף צ׳ק-אין ציבורי לכל מתאמן (`/checkin/[token]`) — שומר ל-DB
- [x] כלי מיגרציה: `scripts/db.ts` (Management API, `SUPABASE_ACCESS_TOKEN`)

## שלב 1.5 — קשב: rebrand + סיידבר + מודולים (2026-09-10) ✅

- [x] שם חדש: **קשב** · עיצוב חדש (בהיר, Assistant, flat) · תפריט צד קבוע
- [x] דשבורד כרשימה + דגלים רב-יומיים (`src/lib/flags.ts`): שבוע שינה קצרה, HRV נמוך, דופק מוגבה
- [x] משימות (`/tasks`) — הוספה/סימון/מחיקה, שיוך למתאמן
- [x] שאלון בוקר נבנה (`/questionnaire`) — הצ׳ק-אין הציבורי נבנה מהקונפיג; תשובות חופשיות ב-`daily_checkins.answers`
- [x] הגדרות מערכת (`/settings`) — שם, ספי מוכנוּת (משפיעים על `band()`)
- [x] בדיקות דם (`/bloodwork`) — פאנלים + סמנים + ניתוח AI (Claude, דורש `ANTHROPIC_API_KEY`)
- [x] מיגרציה `0002_app.sql`: tasks, questionnaire_questions, blood_*, coach_settings + RLS

## שלב 2 — לולאת הקשר

- [ ] הזנה ידנית של נתוני שעון (טופס למאמן / למתאמן) — הבא בתור
- [ ] יומן מאמן לכל מתאמן (ציר זמן של הערות)
- [ ] Vercel Cron יומי 06:00 → מייל עם קישור צ׳ק-אין אישי (Resend)
- [ ] `ANTHROPIC_API_KEY` ב-Vercel (לניתוח בדיקות דם בפרודקשן)

## שלב 3 — נתוני גרמין

**מסקנה (2026-09-10):** אין דרך זולה. Terra/Rook/Vital = ~$399/חודש. ה-API של גרמין
סגור לשימוש אישי ומושהה. **הנתונים כבר ב-TrainingPeaks** (הסנכרון של המתאמן מזרים
HRV/RHR/שינה/Body Battery לשם). ה-API של TP סגור אף הוא לשימוש אישי, אבל **ייצוא CSV
עובד** (Settings → Export Data, per athlete, עד 12 חודשים).

- [ ] מייבא CSV מ-TrainingPeaks → `daily_metrics` (מיפוי עמודות מול קובץ אמיתי מעומרי)
- [ ] בקשה ל-API של TrainingPeaks (ברקע, לא חוסם)

## שלב 4 — ליטוש

- [ ] WhatsApp (Twilio / 360dialog)
- [ ] מדיניות פרטיות + מחיקת מתאמן
- [ ] ציר זמן ארוך (30/90 יום) למתאמן

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
