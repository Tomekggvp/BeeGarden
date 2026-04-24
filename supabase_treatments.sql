-- Run this SQL in the Supabase SQL editor.
-- It creates a per-user treatment history linked to each hive.

create table if not exists public.treatments (
  id bigserial primary key,
  user_id text not null,
  hive_id text not null,
  start_date date not null,
  end_date date not null,
  disease text not null,
  medication text not null,
  dosage text not null,
  created_at timestamptz not null default now(),
  constraint treatments_dates_check check (end_date >= start_date)
);

create index if not exists treatments_user_hive_idx
  on public.treatments (user_id, hive_id, start_date desc);

alter table public.treatments enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'treatments'
  loop
    execute format('drop policy if exists %I on public.treatments', policy_record.policyname);
  end loop;
end $$;

create policy treatments_select_own
  on public.treatments
  for select
  using (user_id::text = auth.uid()::text);

create policy treatments_insert_own
  on public.treatments
  for insert
  with check (user_id::text = auth.uid()::text);

create policy treatments_update_own
  on public.treatments
  for update
  using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);

create policy treatments_delete_own
  on public.treatments
  for delete
  using (user_id::text = auth.uid()::text);
