-- קשב — full daily metric set (Garmin). Run:
--   npx tsx scripts/db.ts supabase/migrations/0003_metrics.sql

alter table public.daily_metrics
  -- autonomic / recovery
  add column if not exists hrv_status       text,      -- balanced | unbalanced | low | poor
  add column if not exists respiration      numeric,   -- nightly avg breaths/min
  add column if not exists spo2_avg         numeric,   -- nightly avg %
  add column if not exists spo2_min         numeric,
  -- sleep detail
  add column if not exists sleep_deep_min   integer,
  add column if not exists sleep_light_min  integer,
  add column if not exists sleep_rem_min    integer,
  add column if not exists sleep_awake_min  integer,
  add column if not exists bedtime          text,      -- "HH:MM"
  add column if not exists wake_time        text,      -- "HH:MM"
  -- energy
  add column if not exists body_battery_high integer,
  add column if not exists body_battery_low  integer,
  -- stress
  add column if not exists stress_avg       numeric,   -- Garmin all-day stress 0-100
  add column if not exists stress_high_min  integer,
  add column if not exists rest_min         integer,
  -- activity
  add column if not exists steps            integer,
  add column if not exists active_min       integer,   -- moderate+vigorous
  add column if not exists intensity_min    integer,   -- Garmin intensity minutes
  add column if not exists calories         integer,
  add column if not exists floors           integer,
  -- training
  add column if not exists atl              numeric,   -- acute load (~7d)
  add column if not exists ctl              numeric,   -- chronic load (~42d)
  add column if not exists training_readiness integer, -- Garmin's own 0-100
  add column if not exists training_status  text,
  add column if not exists recovery_hours   numeric,
  add column if not exists vo2max           numeric,
  -- body
  add column if not exists weight_kg        numeric;

-- grants carry to new columns automatically (column-level), but re-assert table grants
grant select, insert, update, delete on public.daily_metrics to authenticated;
grant all privileges on public.daily_metrics to service_role;
