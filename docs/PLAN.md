# תוכנית בנייה — Athlete Platform

## שלב 0 — יסודות ✅ (בתהליך)

- [x] שלד Next.js 16 + TypeScript + Tailwind
- [x] git init + commit ראשון
- [ ] GitHub repo + push
- [ ] חיבור Vercel ל-repo (דיפלוי אוטומטי בכל push)
- [ ] פרויקט Supabase + חיבור מקומי (`.env.local`)

## שלב 1 — שמיש בלי גרמין

המטרה: המאמן משתמש בזה כל בוקר, גם אם הנתונים מוזנים ידנית.

- [ ] סכימת DB: `athletes`, `daily_checkins`, `daily_metrics`, `coaches`
- [ ] Auth למאמן (Supabase Auth)
- [ ] דף צ׳ק-אין ציבורי לכל מתאמן (`/checkin/[token]`) — טופס, נשמר ל-DB
- [ ] דשבורד "מוקד בוקר" — רשימת מתאמנים, ציון מוכנוּת, מסודר לפי דחיפוּת
- [ ] דף מתאמן — גרפים 7 ימים + היסטוריית צ׳ק-אין
- [ ] Vercel Cron יומי 06:00 → שליחת מייל עם קישור צ׳ק-אין אישי (Resend)
- [ ] הזנה ידנית של נתוני שעון (טופס למאמן) עד שגרמין מחובר

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
