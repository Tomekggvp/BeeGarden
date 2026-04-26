-- Run this SQL in the Supabase SQL editor.
-- It stores per-hive flags: pumping/treatment required + notification toggles.

create table if not exists public.hive_checks (
  user_id text not null,
  hive_id text not null,
  pumping_required boolean not null default false,
  pumping_notifications_enabled boolean not null default false,
  treatment_required boolean not null default false,
  treatment_notifications_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, hive_id)
);

create index if not exists hive_checks_user_idx
  on public.hive_checks (user_id);

create index if not exists hive_checks_user_pumping_idx
  on public.hive_checks (user_id, pumping_required)
  where pumping_required = true;

create index if not exists hive_checks_user_treatment_idx
  on public.hive_checks (user_id, treatment_required)
  where treatment_required = true;

alter table public.hive_checks enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'hive_checks'
  loop
    execute format('drop policy if exists %I on public.hive_checks', policy_record.policyname);
  end loop;
end $$;

create policy hive_checks_select_own
  on public.hive_checks
  for select
  using (user_id::text = auth.uid()::text);

create policy hive_checks_insert_own
  on public.hive_checks
  for insert
  with check (user_id::text = auth.uid()::text);

create policy hive_checks_update_own
  on public.hive_checks
  for update
  using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);

create policy hive_checks_delete_own
  on public.hive_checks
  for delete
  using (user_id::text = auth.uid()::text);

