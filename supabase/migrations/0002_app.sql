-- קשב — tasks, configurable morning questionnaire, bloodwork, coach settings.
-- Run: npx tsx scripts/db.ts supabase/migrations/0002_app.sql

-- ============================================================
-- tasks — coach to-dos, optionally tied to an athlete
-- ============================================================
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.coaches (id) on delete cascade,
  athlete_id  uuid references public.athletes (id) on delete set null,
  title       text not null,
  done        boolean not null default false,
  due_date    date,
  created_at  timestamptz not null default now(),
  done_at     timestamptz
);
create index if not exists tasks_coach_open_idx
  on public.tasks (coach_id, done, due_date);

-- ============================================================
-- questionnaire_questions — the coach builds their check-in
-- ============================================================
create table if not exists public.questionnaire_questions (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.coaches (id) on delete cascade,
  form        text not null default 'daily' check (form in ('daily', 'weekly')),
  key         text not null,          -- stable id used in daily_checkins.answers
  label       text not null,
  kind        text not null default 'scale' check (kind in ('scale', 'number', 'text', 'boolean')),
  low_label   text,                   -- for scale
  high_label  text,
  invert      boolean not null default false,  -- scale: is a high value bad?
  position    integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (coach_id, form, key)
);
create index if not exists qq_coach_form_idx
  on public.questionnaire_questions (coach_id, form, position);

-- free-form answers for questions beyond the fixed columns
alter table public.daily_checkins
  add column if not exists answers jsonb not null default '{}'::jsonb;

-- ============================================================
-- bloodwork
-- ============================================================
create table if not exists public.blood_panels (
  id           uuid primary key default gen_random_uuid(),
  athlete_id   uuid not null references public.athletes (id) on delete cascade,
  drawn_on     date not null,
  lab          text,
  fasting      boolean,
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists blood_panels_athlete_idx
  on public.blood_panels (athlete_id, drawn_on desc);

create table if not exists public.blood_markers (
  id         uuid primary key default gen_random_uuid(),
  panel_id   uuid not null references public.blood_panels (id) on delete cascade,
  name       text not null,
  value      numeric,
  text_value text,
  unit       text,
  ref_low    numeric,
  ref_high   numeric,
  created_at timestamptz not null default now()
);
create index if not exists blood_markers_panel_idx
  on public.blood_markers (panel_id);

create table if not exists public.blood_analyses (
  id         uuid primary key default gen_random_uuid(),
  panel_id   uuid not null references public.blood_panels (id) on delete cascade,
  summary    text not null,
  model      text,
  created_at timestamptz not null default now()
);
create index if not exists blood_analyses_panel_idx
  on public.blood_analyses (panel_id, created_at desc);

-- ============================================================
-- coach_settings — one row per coach (JSON blob of preferences)
-- ============================================================
create table if not exists public.coach_settings (
  coach_id   uuid primary key references public.coaches (id) on delete cascade,
  settings   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.tasks                   enable row level security;
alter table public.questionnaire_questions  enable row level security;
alter table public.blood_panels             enable row level security;
alter table public.blood_markers            enable row level security;
alter table public.blood_analyses           enable row level security;
alter table public.coach_settings           enable row level security;

drop policy if exists "coach owns tasks" on public.tasks;
create policy "coach owns tasks" on public.tasks for all
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

drop policy if exists "coach owns questions" on public.questionnaire_questions;
create policy "coach owns questions" on public.questionnaire_questions for all
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

drop policy if exists "coach owns settings" on public.coach_settings;
create policy "coach owns settings" on public.coach_settings for all
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

drop policy if exists "coach owns athletes' panels" on public.blood_panels;
create policy "coach owns athletes' panels" on public.blood_panels for all
  using (exists (select 1 from public.athletes a
    where a.id = blood_panels.athlete_id and a.coach_id = auth.uid()))
  with check (exists (select 1 from public.athletes a
    where a.id = blood_panels.athlete_id and a.coach_id = auth.uid()));

drop policy if exists "coach owns markers" on public.blood_markers;
create policy "coach owns markers" on public.blood_markers for all
  using (exists (select 1 from public.blood_panels p join public.athletes a on a.id = p.athlete_id
    where p.id = blood_markers.panel_id and a.coach_id = auth.uid()))
  with check (exists (select 1 from public.blood_panels p join public.athletes a on a.id = p.athlete_id
    where p.id = blood_markers.panel_id and a.coach_id = auth.uid()));

drop policy if exists "coach owns analyses" on public.blood_analyses;
create policy "coach owns analyses" on public.blood_analyses for all
  using (exists (select 1 from public.blood_panels p join public.athletes a on a.id = p.athlete_id
    where p.id = blood_analyses.panel_id and a.coach_id = auth.uid()))
  with check (exists (select 1 from public.blood_panels p join public.athletes a on a.id = p.athlete_id
    where p.id = blood_analyses.panel_id and a.coach_id = auth.uid()));

-- ============================================================
-- Grants (expose-new-tables is off)
-- ============================================================
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;
