-- Owner-only application policies, reviewed against the live schema on 2026-11-25.
-- Replaces the existing duplicate/per-row policies without changing stored rows.
begin;
do $$
declare
  target_table text;
  old_policy record;
  owner_expression text;
  owner_type text;
begin
  foreach target_table in array array[
    'hives', 'beehive_details', 'tasks', 'hive_checks', 'honey_pumpings',
    'treatments', 'user_locations', 'push_subscriptions', 'task_notification_history'
  ] loop
    select c.udt_name into owner_type from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = target_table and c.column_name = 'user_id';
    if owner_type is null or owner_type not in ('uuid', 'text') then
      raise exception 'Unsupported or missing user_id on public.%', target_table;
    end if;
    owner_expression := case when owner_type = 'uuid'
      then 'user_id = (select auth.uid())'
      else 'user_id = (select auth.uid()::text)' end;
    execute format('alter table public.%I enable row level security', target_table);
    execute format('revoke all on public.%I from anon, public', target_table);
    for old_policy in select policyname from pg_policies
      where schemaname = 'public' and tablename = target_table loop
      execute format('drop policy %I on public.%I', old_policy.policyname, target_table);
    end loop;
    execute format('create policy beegarden_owner_access on public.%I for all to authenticated using (%s) with check (%s)', target_table, owner_expression, owner_expression);
    execute format('grant select, insert, update, delete on public.%I to authenticated', target_table);
    execute format('revoke truncate, references, trigger on public.%I from authenticated', target_table);
  end loop;
end $$;
-- Only the privileged reminder worker writes notification history.
revoke insert, update on public.task_notification_history from authenticated;
grant usage, select on sequence public.push_subscriptions_id_seq, public.treatments_id_seq,
  public.honey_pumpings_id_seq to authenticated;

-- Existing owner-prefix indexes already cover the other tables.
create index if not exists beegarden_details_owner_idx on public.beehive_details (user_id);
create index if not exists beegarden_hives_created_idx on public.hives (user_id, created_at);
create index if not exists beegarden_due_reminders_idx on public.tasks (reminder_at)
  where reminder_enabled = true and reminder_notified_at is null;
create index if not exists beegarden_pumpings_date_idx on public.honey_pumpings (user_id, pumping_date desc, created_at desc);
commit;
