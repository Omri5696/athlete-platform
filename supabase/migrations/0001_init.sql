-- Athlete Platform — initial schema (phase 1)
-- Run in the Supabase SQL editor (until the Supabase CLI is wired up).

-- ============================================================
-- coaches — one row per coach, linked to a Supabase Auth user
-- ============================================================
create table if not exists public.coaches (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- athletes
-- ============================================================
create table if not exists public.athletes (
  id             uuid primary key default gen_random_uuid(),
  coach_id       uuid not null references public.coaches (id) on delete cascade,
  name           text not null,
  focus          text not null default '',
  -- opaque token for the athlete's personal check-in link (/checkin/<token>)
  checkin_token  text not null unique default encode(gen_random_bytes(16), 'hex'),
  garmin_linked  boolean not null default false,
  created_at     timestamptz not null default now(),
  archived_at    timestamptz
);
create index if not exists athletes_coach_id_idx on public.athletes (coach_id);

-- ============================================================
-- daily_metrics — objective, one row per athlete per day
-- (manual entry now; Garmin via Terra/Vital in phase 2)
-- ============================================================
create table if not exists public.daily_metrics (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid not null references public.athletes (id) on delete cascade,
  metric_date   date not null,
  hrv           numeric,          -- ms
  rhr           numeric,          -- bpm
  sleep_hours   numeric,
  body_battery  integer,          -- 0..100
  sleep_score   integer,          -- 0..100
  load          numeric,          -- Garmin training load
  source        text not null default 'manual' check (source in ('manual', 'garmin')),
  created_at    timestamptz not null default now(),
  unique (athlete_id, metric_date)
);
create index if not exists daily_metrics_athlete_date_idx
  on public.daily_metrics (athlete_id, metric_date desc);

-- ============================================================
-- daily_checkins — subjective, one row per athlete per day
-- 1..5 scales; higher soreness/stress is worse
-- ============================================================
create table if not exists public.daily_checkins (
  id             uuid primary key default gen_random_uuid(),
  athlete_id     uuid not null references public.athletes (id) on delete cascade,
  checkin_date   date not null,
  sleep_quality  integer check (sleep_quality between 1 and 5),
  energy         integer check (energy between 1 and 5),
  mood           integer check (mood between 1 and 5),
  soreness       integer check (soreness between 1 and 5),
  stress         integer check (stress between 1 and 5),
  sleep_hours    numeric,
  weight_kg      numeric,
  ate            text,
  note           text,
  created_at     timestamptz not null default now(),
  unique (athlete_id, checkin_date)
);
create index if not exists daily_checkins_athlete_date_idx
  on public.daily_checkins (athlete_id, checkin_date desc);

-- ============================================================
-- Row Level Security
-- A coach can only touch their own athletes and those athletes' data.
-- Check-in submissions from athletes go through a server action using the
-- service-role key (token-verified), so no anon policies are needed yet.
-- ============================================================
alter table public.coaches        enable row level security;
alter table public.athletes       enable row level security;
alter table public.daily_metrics  enable row level security;
alter table public.daily_checkins enable row level security;

drop policy if exists "coach reads own row" on public.coaches;
create policy "coach reads own row"
  on public.coaches for select using (id = auth.uid());

drop policy if exists "coach manages own athletes" on public.athletes;
create policy "coach manages own athletes"
  on public.athletes for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

drop policy if exists "coach manages own athletes' metrics" on public.daily_metrics;
create policy "coach manages own athletes' metrics"
  on public.daily_metrics for all
  using (exists (
    select 1 from public.athletes a
    where a.id = daily_metrics.athlete_id and a.coach_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.athletes a
    where a.id = daily_metrics.athlete_id and a.coach_id = auth.uid()
  ));

drop policy if exists "coach manages own athletes' checkins" on public.daily_checkins;
create policy "coach manages own athletes' checkins"
  on public.daily_checkins for all
  using (exists (
    select 1 from public.athletes a
    where a.id = daily_checkins.athlete_id and a.coach_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.athletes a
    where a.id = daily_checkins.athlete_id and a.coach_id = auth.uid()
  ));

-- ============================================================
-- Grants
-- "Automatically expose new tables" is off, so grant access explicitly.
-- service_role = trusted backend (server actions, webhooks, cron); it also
-- bypasses RLS. anon / authenticated stay ungranted until a feature needs
-- them, and are gated by the RLS policies above when granted.
-- ============================================================
grant usage on schema public to service_role, authenticated;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;

-- authenticated (the logged-in coach) — RLS policies above restrict rows
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage on sequences to authenticated;
