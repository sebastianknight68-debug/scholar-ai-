-- Migration 003 — rename "starter" plan to "student" (v2 pricing)
-- Run this in your Supabase SQL editor.

-- Update the constraint to accept the new plan name (and only the new set)
alter table public.users drop constraint if exists users_plan_check;
alter table public.users
  add constraint users_plan_check
  check (plan in ('free','student','pro','max'));

-- Migrate any rows still on the older 'starter' or legacy 'student' plan to the new student plan
update public.users set plan = 'student' where plan = 'starter';
