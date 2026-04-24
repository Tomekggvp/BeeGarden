-- Run this SQL in the Supabase SQL editor.
-- It stores the history of task reminders that were sent to the user.

create table if not exists public.task_notification_history (
  id bigserial primary key,
  user_id text not null,
  task_id text not null,
  hive_id text not null,
  task_text text not null,
  reminder_at timestamptz,
  delivered_at timestamptz not null default now()
);

create unique index if not exists task_notification_history_user_task_uidx
  on public.task_notification_history (user_id, task_id);

create index if not exists task_notification_history_user_delivered_idx
  on public.task_notification_history (user_id, delivered_at desc);

alter table public.task_notification_history enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'task_notification_history'
  loop
    execute format('drop policy if exists %I on public.task_notification_history', policy_record.policyname);
  end loop;
end $$;

create policy task_notification_history_select_own
  on public.task_notification_history
  for select
  using (user_id::text = auth.uid()::text);

create policy task_notification_history_insert_own
  on public.task_notification_history
  for insert
  with check (user_id::text = auth.uid()::text);

create policy task_notification_history_update_own
  on public.task_notification_history
  for update
  using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);

create policy task_notification_history_delete_own
  on public.task_notification_history
  for delete
  using (user_id::text = auth.uid()::text);

insert into public.task_notification_history (
  user_id,
  task_id,
  hive_id,
  task_text,
  reminder_at,
  delivered_at
)
select
  user_id,
  id::text,
  hive_id,
  task_text,
  reminder_at,
  reminder_notified_at
from public.tasks
where reminder_notified_at is not null
on conflict (user_id, task_id) do nothing;
