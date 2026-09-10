#!/usr/bin/env python3
"""
קשב — daily Garmin sync.

Pulls each connected athlete's Garmin Connect wellness data (sleep, HRV, resting
HR, stress, Body Battery, steps, respiration, SpO2, training readiness, VO2max,
ACWR, weight) and upserts it into the `daily_metrics` table.

Unofficial: this talks to Garmin Connect the way the app does. It can break when
Garmin changes their auth (~1-2×/year). For personal use with a handful of
consented accounts.

Config — one of:
  1) sync/accounts.json  ->  [{"athlete_id": "...", "email": "...", "password": "..."}]
  2) env vars: GARMIN_EMAIL, GARMIN_PASSWORD, KESHEV_ATHLETE_ID   (single athlete)

Always needs (env or sync/.env):
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

Run:
  cd sync && pip install -r requirements.txt
  python3 sync.py            # last 3 days
  python3 sync.py --days 45  # backfill
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import urllib.request
from datetime import date, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent


# ----------------------------------------------------------------------------- env
def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        v = v.strip().strip('"').strip("'")
        if v and not os.environ.get(k.strip()):
            os.environ[k.strip()] = v


load_dotenv(HERE / ".env")
load_dotenv(HERE.parent / ".env.local")

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (put them in sync/.env)")


def accounts() -> list[dict]:
    f = HERE / "accounts.json"
    if f.exists():
        return json.loads(f.read_text())
    email = os.environ.get("GARMIN_EMAIL")
    pw = os.environ.get("GARMIN_PASSWORD")
    aid = os.environ.get("KESHEV_ATHLETE_ID")
    if email and pw and aid:
        return [{"athlete_id": aid, "email": email, "password": pw}]
    sys.exit("No accounts: create sync/accounts.json or set GARMIN_EMAIL / GARMIN_PASSWORD / KESHEV_ATHLETE_ID")


# --------------------------------------------------------------------------- helpers
def g(d, *path, default=None):
    """nested dict/list access; returns default on any miss"""
    cur = d
    for key in path:
        try:
            cur = cur[key]
        except (KeyError, IndexError, TypeError):
            return default
    return default if cur is None else cur


def hm(ts_ms):
    if not ts_ms:
        return None
    from datetime import datetime
    return datetime.fromtimestamp(ts_ms / 1000).strftime("%H:%M")


def num(v):
    try:
        return round(float(v), 3) if v is not None else None
    except (TypeError, ValueError):
        return None


# ------------------------------------------------------------------------ extraction
def extract(api, cdate: str) -> dict:
    """cdate = YYYY-MM-DD. Returns a partial daily_metrics row (only non-null keys)."""
    row: dict = {}

    def put(col, val):
        if val is not None:
            row[col] = val

    # --- daily summary (steps, calories, RHR, stress, body battery, intensity) ---
    try:
        s = api.get_user_summary(cdate) or {}
        put("steps", g(s, "totalSteps"))
        put("floors", g(s, "floorsAscended"))
        put("calories", g(s, "totalKilocalories") or g(s, "activeKilocalories"))
        put("rhr", g(s, "restingHeartRate"))
        put("stress_avg", g(s, "averageStressLevel"))
        hi = g(s, "highStressDuration")
        put("stress_high_min", round(hi / 60) if hi else None)
        rest = g(s, "restStressDuration")
        put("rest_min", round(rest / 60) if rest else None)
        put("body_battery", g(s, "bodyBatteryAtWakeTime") or g(s, "bodyBatteryMostRecentValue"))
        put("body_battery_high", g(s, "bodyBatteryHighestValue"))
        put("body_battery_low", g(s, "bodyBatteryLowestValue"))
        mod = g(s, "moderateIntensityMinutes", default=0) or 0
        vig = g(s, "vigorousIntensityMinutes", default=0) or 0
        if mod or vig:
            row["active_min"] = mod + vig
            row["intensity_min"] = mod + 2 * vig
    except Exception as e:  # noqa: BLE001
        print(f"    user_summary: {e}")

    # --- sleep ---
    try:
        sl = api.get_sleep_data(cdate) or {}
        dto = g(sl, "dailySleepDTO", default={})
        secs = g(dto, "sleepTimeSeconds")
        put("sleep_hours", round(secs / 3600, 2) if secs else None)
        for col, key in (
            ("sleep_deep_min", "deepSleepSeconds"),
            ("sleep_light_min", "lightSleepSeconds"),
            ("sleep_rem_min", "remSleepSeconds"),
            ("sleep_awake_min", "awakeSleepSeconds"),
        ):
            v = g(dto, key)
            put(col, round(v / 60) if v else None)
        put("sleep_score", g(dto, "sleepScores", "overall", "value") or g(sl, "sleepScores", "overall", "value"))
        put("bedtime", hm(g(dto, "sleepStartTimestampLocal")))
        put("wake_time", hm(g(dto, "sleepEndTimestampLocal")))
    except Exception as e:  # noqa: BLE001
        print(f"    sleep: {e}")

    # --- HRV ---
    try:
        h = api.get_hrv_data(cdate) or {}
        put("hrv", g(h, "hrvSummary", "lastNightAvg"))
        st = g(h, "hrvSummary", "status")
        put("hrv_status", st.lower() if isinstance(st, str) else None)
    except Exception as e:  # noqa: BLE001
        print(f"    hrv: {e}")

    # --- respiration ---
    try:
        r = api.get_respiration_data(cdate) or {}
        put("respiration", num(g(r, "avgSleepRespirationValue") or g(r, "avgWakingRespirationValue")))
    except Exception as e:  # noqa: BLE001
        print(f"    respiration: {e}")

    # --- SpO2 ---
    try:
        o = api.get_spo2_data(cdate) or {}
        put("spo2_avg", g(o, "averageSpO2"))
        put("spo2_min", g(o, "lowestSpO2"))
    except Exception as e:  # noqa: BLE001
        print(f"    spo2: {e}")

    # --- training readiness ---
    try:
        tr = api.get_training_readiness(cdate) or []
        put("training_readiness", g(tr, 0, "score"))
    except Exception as e:  # noqa: BLE001
        print(f"    training_readiness: {e}")

    # --- training status: VO2max + ACWR ---
    try:
        ts = api.get_training_status(cdate) or {}
        put("vo2max", num(g(ts, "mostRecentVO2Max", "generic", "vo2MaxValue")))
        latest = g(ts, "mostRecentTrainingStatus", "latestTrainingStatusData", default={})
        if isinstance(latest, dict) and latest:
            first = next(iter(latest.values()), {})
            acute = g(first, "acuteTrainingLoadDTO", default={})
            put("atl", num(g(acute, "dailyTrainingLoadAcute")))
            put("ctl", num(g(acute, "dailyTrainingLoadChronic")))
            put("training_status", str(g(first, "trainingStatus")) if g(first, "trainingStatus") is not None else None)
    except Exception as e:  # noqa: BLE001
        print(f"    training_status: {e}")

    if "vo2max" not in row:
        try:
            mm = api.get_max_metrics(cdate) or []
            put("vo2max", num(g(mm, 0, "generic", "vo2MaxValue")))
        except Exception:  # noqa: BLE001
            pass

    # --- daily training load = sum of the day's activities ---
    try:
        acts = api.get_activities_by_date(cdate, cdate) or []
        load = sum((a.get("activityTrainingLoad") or 0) for a in acts)
        if load:
            row["load"] = round(load, 1)
    except Exception as e:  # noqa: BLE001
        print(f"    activities: {e}")

    # --- weight ---
    try:
        w = api.get_daily_weigh_ins(cdate) or {}
        grams = g(w, "totalAverage", "weight") or g(w, "dateWeightList", 0, "weight")
        put("weight_kg", round(grams / 1000, 1) if grams else None)
    except Exception as e:  # noqa: BLE001
        print(f"    weight: {e}")

    return row


# ------------------------------------------------------------------------- supabase
def upsert(rows: list[dict]) -> None:
    url = f"{SUPABASE_URL}/rest/v1/daily_metrics?on_conflict=athlete_id,metric_date"
    body = json.dumps(rows).encode()
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
    )
    with urllib.request.urlopen(req) as resp:  # noqa: S310
        if resp.status not in (200, 201, 204):
            raise RuntimeError(f"supabase {resp.status}: {resp.read().decode()}")


# ------------------------------------------------------------------------------ main
def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=3, help="how many days back to sync")
    args = ap.parse_args()

    from garminconnect import Garmin

    dates = [(date.today() - timedelta(days=i)).isoformat() for i in range(args.days)]

    for acc in accounts():
        aid = acc["athlete_id"]
        email = acc["email"]
        token_dir = HERE / ".garmin" / hashlib.sha1(email.encode()).hexdigest()[:12]
        token_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n▶ {email}  →  athlete {aid}")
        try:
            try:
                api = Garmin(email, acc["password"], prompt_mfa=lambda: input("Garmin MFA code: "))
            except TypeError:
                api = Garmin(email, acc["password"])  # older lib, no prompt_mfa arg
            api.login(str(token_dir))
        except Exception as e:  # noqa: BLE001
            print(f"  login failed: {e}")
            print("  (if this mentions Cloudflare / 403 / TLS: your garminconnect is too old — needs Python 3.12+ and garminconnect>=0.3.13)")
            continue

        rows = []
        for cdate in dates:
            row = extract(api, cdate)
            got = [k for k in row]
            if not got:
                print(f"  {cdate}: (no data)")
                continue
            row.update({"athlete_id": aid, "metric_date": cdate, "source": "garmin"})
            rows.append(row)
            print(f"  {cdate}: {', '.join(sorted(got))}")

        if rows:
            upsert(rows)
            print(f"  ✓ upserted {len(rows)} day(s)")
        else:
            print("  nothing to upsert")


if __name__ == "__main__":
    main()
