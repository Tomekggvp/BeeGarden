-- Run this SQL in the Supabase SQL editor.
-- It creates per-user honey pumping records linked to each hive.

create table if not exists public.honey_pumpings (
  id bigserial primary key,
  user_id text not null,
  hive_id text not null,
  pumping_date date not null,
  volume_liters numeric(10, 2) not null,
  honey_type text not null,
  created_at timestamptz not null default now(),
  constraint honey_pumpings_volume_check check (volume_liters > 0)
);

create index if not exists honey_pumpings_user_hive_idx
  on public.honey_pumpings (user_id, hive_id, pumping_date desc);

alter table public.honey_pumpings enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'honey_pumpings'
  loop
    execute format('drop policy if exists %I on public.honey_pumpings', policy_record.policyname);
  end loop;
end $$;

create policy honey_pumpings_select_own
  on public.honey_pumpings
  for select
  using (user_id::text = auth.uid()::text);

create policy honey_pumpings_insert_own
  on public.honey_pumpings
  for insert
  with check (user_id::text = auth.uid()::text);

create policy honey_pumpings_update_own
  on public.honey_pumpings
  for update
  using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);

create policy honey_pumpings_delete_own
  on public.honey_pumpings
  for delete
  using (user_id::text = auth.uid()::text);
