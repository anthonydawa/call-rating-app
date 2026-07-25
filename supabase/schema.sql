-- Run once in Supabase > SQL Editor.
create extension if not exists "pgcrypto";

create table if not exists public.call_evaluations (
  id uuid primary key default gen_random_uuid(),
  external_call_id text not null unique,
  agent_id text,
  agent_name text not null,
  contact_name text not null default 'Unknown contact',
  contact_phone text,
  direction text not null default 'outbound' check (direction in ('inbound', 'outbound')),
  started_at timestamptz not null,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  overall_score integer not null check (overall_score between 0 and 100),
  outcome text not null default 'neutral' check (outcome in ('won', 'follow_up', 'lost', 'neutral')),
  sentiment text not null default 'neutral' check (sentiment in ('positive', 'neutral', 'negative')),
  summary text not null,
  strengths jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  rubric_scores jsonb not null default '{"opening":0,"discovery":0,"communication":0,"objection_handling":0,"closing":0}'::jsonb,
  transcript text not null,
  recording_url text,
  ai_model text not null default 'llama-3.3-70b-versatile',
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists call_evaluations_started_at_idx on public.call_evaluations (started_at desc);
create index if not exists call_evaluations_agent_name_idx on public.call_evaluations (agent_name);
alter table public.call_evaluations enable row level security;
grant select on table public.call_evaluations to anon;
grant select, insert, update, delete on table public.call_evaluations to service_role;
drop policy if exists "Public dashboard can read evaluations" on public.call_evaluations;
create policy "Public dashboard can read evaluations" on public.call_evaluations for select to anon using (true);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists set_call_evaluations_updated_at on public.call_evaluations;
create trigger set_call_evaluations_updated_at before update on public.call_evaluations
for each row execute function public.set_updated_at();
