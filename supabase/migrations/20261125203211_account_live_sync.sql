begin;
create schema if not exists private;
create policy beegarden_account_receive on realtime.messages for select to authenticated
  using (extension = 'broadcast' and (select realtime.topic()) = 'account:' || (select auth.uid())::text);

-- Only an invalidation is sent, never row contents or deleted primary keys.
create function private.notify_account_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare owner_id text;
begin
  if tg_op = 'UPDATE' and new is not distinct from old then return null; end if;
  if tg_op = 'DELETE' then owner_id := old.user_id::text;
  else owner_id := new.user_id::text; end if;
  if owner_id is null then return null; end if;
  perform realtime.send(jsonb_build_object('table',tg_table_name), 'data_changed', 'account:' || owner_id, true);
  if tg_op = 'UPDATE' and old.user_id is not null and old.user_id::text is distinct from owner_id then
    perform realtime.send(jsonb_build_object('table',tg_table_name), 'data_changed', 'account:' || old.user_id::text, true);
  end if;
  return null;
end $$;
revoke all on function private.notify_account_change() from public, anon, authenticated, service_role;
do $$ declare target text;
begin
  foreach target in array array['hives','apiaries','beehive_details','tasks','hive_checks','honey_pumpings','treatments','task_notification_history','push_subscriptions','user_locations'] loop
    execute format('create trigger beegarden_account_change after insert or update or delete on public.%I for each row execute function private.notify_account_change()',target);
  end loop;
end $$;
commit;
