-- Run this SQL in the Supabase SQL editor.
-- It extends the existing public.tasks table with per-user reminders.

alter table public.tasks
  add column if not exists reminder_at timestamptz,
  add column if not exists reminder_enabled boolean not null default false,
  add column if not exists reminder_notified_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

update public.tasks
set reminder_enabled = false
where reminder_at is null;

create index if not exists tasks_user_hive_idx
  on public.tasks (user_id, hive_id);

create index if not exists tasks_pending_reminders_idx
  on public.tasks (user_id, reminder_at)
  where reminder_enabled = true and reminder_notified_at is null;

alter table public.tasks enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tasks'
  loop
    execute format('drop policy if exists %I on public.tasks', policy_record.policyname);
  end loop;
end $$;

create policy tasks_select_own
  on public.tasks
  for select
  using (user_id::text = auth.uid()::text);

create policy tasks_insert_own
  on public.tasks
  for insert
  with check (user_id::text = auth.uid()::text);

create policy tasks_update_own
  on public.tasks
  for update
  using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);

create policy tasks_delete_own
  on public.tasks
  for delete
  using (user_id::text = auth.uid()::text);

create table if not exists public.push_subscriptions (
  id bigserial primary key,
  user_id text not null,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'push_subscriptions'
  loop
    execute format('drop policy if exists %I on public.push_subscriptions', policy_record.policyname);
  end loop;
end $$;

create policy push_subscriptions_select_own
  on public.push_subscriptions
  for select
  using (user_id::text = auth.uid()::text);

create policy push_subscriptions_insert_own
  on public.push_subscriptions
  for insert
  with check (user_id::text = auth.uid()::text);

create policy push_subscriptions_update_own
  on public.push_subscriptions
  for update
  using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);

create policy push_subscriptions_delete_own
  on public.push_subscriptions
  for delete
  using (user_id::text = auth.uid()::text);

/*
If you do not want to drop existing policies automatically, use the safer
idempotent block below instead of the policy reset block above.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'tasks'
      and policyname = 'tasks_select_own'
  ) then
    create policy tasks_select_own
      on public.tasks
      for select
      using (user_id::text = auth.uid()::text);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'tasks'
      and policyname = 'tasks_insert_own'
  ) then
    create policy tasks_insert_own
      on public.tasks
      for insert
      with check (user_id::text = auth.uid()::text);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'tasks'
      and policyname = 'tasks_update_own'
  ) then
    create policy tasks_update_own
      on public.tasks
      for update
      using (user_id::text = auth.uid()::text)
      with check (user_id::text = auth.uid()::text);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'tasks'
      and policyname = 'tasks_delete_own'
  ) then
    create policy tasks_delete_own
      on public.tasks
      for delete
      using (user_id::text = auth.uid()::text);
  end if;
end $$;
*/
