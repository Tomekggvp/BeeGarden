-- Scope both channel authorization and individual message rows to the account.
alter policy beegarden_account_receive on realtime.messages
  using (extension = 'broadcast'
    and topic = 'account:' || (select auth.uid())::text
    and (select realtime.topic()) = topic);
