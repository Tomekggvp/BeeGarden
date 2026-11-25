-- Keep the cast outside the scalar subquery so the linter and planner both
-- recognize auth.uid() as a once-per-statement InitPlan.
begin;
do $$
declare target_table text;
begin
  foreach target_table in array array[
    'hive_checks', 'honey_pumpings', 'treatments', 'user_locations',
    'push_subscriptions', 'task_notification_history'
  ] loop
    execute format('alter policy beegarden_owner_access on public.%I using (user_id = (select auth.uid())::text) with check (user_id = (select auth.uid())::text)', target_table);
  end loop;
end $$;
commit;
