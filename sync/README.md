# סנכרון גרמין — קשב

מושך אוטומטית את נתוני ה-Garmin Connect של מתאמן ל-`daily_metrics`.

**לא רשמי.** מדבר עם Garmin Connect כמו שהאפליקציה מדברת. יכול להישבר כשגרמין משנה
את מנגנון ההתחברות (~פעם-פעמיים בשנה) — אז צריך לעדכן את `garminconnect`.

## התקנה (פעם אחת)

```bash
cd sync
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

ערוך את `sync/.env`:
- `SUPABASE_SERVICE_ROLE_KEY` — מתוך `.env.local` של הפרויקט (השורה `sb_secret_...`)
- `GARMIN_EMAIL` / `GARMIN_PASSWORD` — פרטי ה-Garmin Connect של המתאמן
- `KESHEV_ATHLETE_ID` — כבר ממולא (המתאמן של הניסוי)

## הרצה

```bash
cd sync && source .venv/bin/activate
python3 sync.py              # 3 הימים האחרונים
python3 sync.py --days 45    # מילוי היסטוריה
```

בהרצה הראשונה: אם יש אימות דו-שלבי (MFA) בחשבון הגרמין, תתבקש להזין קוד. אחרי זה
נשמר טוקן ב-`sync/.garmin/` ולא צריך להתחבר שוב.

## אוטומציה יומית (Mac)

אחרי שהרצה ידנית עובדת — מריצים כל בוקר עם `launchd`. ראה
`sync/com.keshev.sync.plist` (נוצר בשלב ההגדרה).

## מספר מתאמנים

מחליפים את שלוש שורות ה-`GARMIN_*` / `KESHEV_ATHLETE_ID` ב-`sync/accounts.json`:

```json
[
  { "athlete_id": "...", "email": "...", "password": "..." }
]
```
