-- ScholarAI database schema
-- Run this in the Supabase SQL editor for a fresh project.
-- Assumes Supabase Auth is enabled.

-- ---------- helpers ----------
create extension if not exists "pgcrypto";

-- ---------- users (profile) ----------
-- supabase auth.users is the source of truth; this mirrors plan/metadata
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  plan text not null default 'free' check (plan in ('free','student','pro')),
  recordings_used_this_month int not null default 0,
  recordings_period_start timestamptz not null default date_trunc('month', now()),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

-- auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- study_sets ----------
create table if not exists public.study_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null default 'Untitled study set',
  sources jsonb not null default '[]'::jsonb,  -- array of source-type tags: ["audio","pdf"]
  status text not null default 'draft' check (status in ('draft','processing','ready','error')),
  created_at timestamptz not null default now()
);
create index if not exists study_sets_user_created_idx on public.study_sets(user_id, created_at desc);

-- ---------- sources ----------
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  study_set_id uuid not null references public.study_sets(id) on delete cascade,
  type text not null check (type in ('audio','pdf','docx','pptx','image','text')),
  raw_text text,
  file_url text,
  filename text,
  created_at timestamptz not null default now()
);
create index if not exists sources_set_idx on public.sources(study_set_id);

-- ---------- study_materials ----------
create table if not exists public.study_materials (
  id uuid primary key default gen_random_uuid(),
  study_set_id uuid not null unique references public.study_sets(id) on delete cascade,
  transcript text,
  smart_notes text,        -- markdown
  flashcards jsonb,        -- [{front, back}]
  quiz jsonb,              -- [{question, options[], correct, explanation}]
  summary jsonb,           -- {tldr, takeaways[], exam_topics[]}
  created_at timestamptz not null default now()
);

-- ---------- conversations ----------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  study_set_id uuid not null references public.study_sets(id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,  -- [{role, content, ts}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conv_set_idx on public.conversations(study_set_id);

-- ---------- storage bucket for raw uploads ----------
-- create a 'sources' bucket via the Supabase dashboard or:
-- insert into storage.buckets (id, name, public) values ('sources','sources', false)
-- on conflict (id) do nothing;

-- ---------- RLS ----------
alter table public.users         enable row level security;
alter table public.study_sets    enable row level security;
alter table public.sources       enable row level security;
alter table public.study_materials enable row level security;
alter table public.conversations enable row level security;

-- users: own row only
drop policy if exists "users self read" on public.users;
create policy "users self read" on public.users
  for select using (auth.uid() = id);
drop policy if exists "users self update" on public.users;
create policy "users self update" on public.users
  for update using (auth.uid() = id);

-- study_sets: owner only
drop policy if exists "sets owner all" on public.study_sets;
create policy "sets owner all" on public.study_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- sources: via parent set
drop policy if exists "sources owner all" on public.sources;
create policy "sources owner all" on public.sources
  for all using (
    exists (select 1 from public.study_sets s where s.id = study_set_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.study_sets s where s.id = study_set_id and s.user_id = auth.uid())
  );

-- study_materials: via parent set
drop policy if exists "materials owner all" on public.study_materials;
create policy "materials owner all" on public.study_materials
  for all using (
    exists (select 1 from public.study_sets s where s.id = study_set_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.study_sets s where s.id = study_set_id and s.user_id = auth.uid())
  );

-- conversations: via parent set
drop policy if exists "conv owner all" on public.conversations;
create policy "conv owner all" on public.conversations
  for all using (
    exists (select 1 from public.study_sets s where s.id = study_set_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.study_sets s where s.id = study_set_id and s.user_id = auth.uid())
  );

-- ---------- helper: monthly counter reset ----------
create or replace function public.reset_monthly_usage()
returns void language plpgsql as $$
begin
  update public.users
     set recordings_used_this_month = 0,
         recordings_period_start = date_trunc('month', now())
   where recordings_period_start < date_trunc('month', now());
end;
$$;

-- ---------- counter increment used by API routes (service role) ----------
create or replace function public.increment_recording_usage(p_user uuid)
returns int language plpgsql security definer as $$
declare new_count int;
begin
  update public.users
     set recordings_used_this_month = case
       when recordings_period_start < date_trunc('month', now()) then 1
       else recordings_used_this_month + 1 end,
         recordings_period_start = case
       when recordings_period_start < date_trunc('month', now()) then date_trunc('month', now())
       else recordings_period_start end
   where id = p_user
   returning recordings_used_this_month into new_count;
  return new_count;
end;
$$;
