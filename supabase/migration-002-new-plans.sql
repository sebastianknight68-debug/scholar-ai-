-- Migration 002 — switch to Free/Starter/Pro/Max + dual usage counters
-- Run this in your Supabase SQL editor.
-- Safe to run on a database that already has the v1 schema.

-- 1) Drop the old plan check constraint and add a new one
alter table public.users drop constraint if exists users_plan_check;
alter table public.users
  add constraint users_plan_check
  check (plan in ('free','starter','pro','max'));

-- Re-default any rows still on the old "student" plan to "starter"
update public.users set plan = 'starter' where plan = 'student';

-- 2) Add new usage columns (file uploads + voice minutes per month)
alter table public.users
  add column if not exists file_uploads_used_this_month int not null default 0;
alter table public.users
  add column if not exists voice_minutes_used_this_month int not null default 0;

-- 3) Replace the increment RPC with one that takes a metric + amount
create or replace function public.increment_usage(
  p_user uuid,
  p_metric text,    -- 'file_uploads' or 'voice_minutes'
  p_amount int
)
returns void language plpgsql security definer as $$
begin
  -- Reset counters if we crossed into a new month
  update public.users
     set file_uploads_used_this_month = 0,
         voice_minutes_used_this_month = 0,
         recordings_period_start = date_trunc('month', now())
   where id = p_user
     and recordings_period_start < date_trunc('month', now());

  if p_metric = 'file_uploads' then
    update public.users
       set file_uploads_used_this_month = file_uploads_used_this_month + p_amount
     where id = p_user;
  elsif p_metric = 'voice_minutes' then
    update public.users
       set voice_minutes_used_this_month = voice_minutes_used_this_month + p_amount
     where id = p_user;
  end if;
end;
$$;

-- The old increment_recording_usage RPC is kept for backward compatibility
-- but you can drop it once nothing calls it:
-- drop function if exists public.increment_recording_usage(uuid);
