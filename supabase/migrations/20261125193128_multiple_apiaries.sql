begin;

create table public.apiaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  is_default boolean not null default false,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  saved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint apiaries_location_pair check ((latitude is null) = (longitude is null)),
  unique (id, user_id)
);
create unique index apiaries_one_default_per_user on public.apiaries(user_id) where is_default;
create index apiaries_owner_created_idx on public.apiaries(user_id, created_at, id);
alter table public.apiaries enable row level security;
revoke all on public.apiaries from public, anon;
grant select, insert, update, delete on public.apiaries to authenticated;
grant all on public.apiaries to service_role;
create policy apiaries_owner_access on public.apiaries for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Preserve every existing hive, history record and saved coordinate.
insert into public.apiaries (user_id, name, is_default, latitude, longitude, saved_at)
select u.id, 'Основная пасека', true, l.latitude, l.longitude, l.saved_at
from auth.users u left join public.user_locations l on l.user_id = u.id::text;

alter table public.hives add column apiary_id uuid;
update public.hives h set apiary_id = a.id
from public.apiaries a where a.user_id = h.user_id and a.is_default;
alter table public.hives alter column apiary_id set not null;
alter table public.hives add constraint hives_apiary_owner_fkey
  foreign key (apiary_id, user_id) references public.apiaries(id, user_id) on delete restrict;
create index hives_apiary_owner_created_idx on public.hives(apiary_id, user_id, created_at);

-- Existing clients can still create hives without an explicit apiary.
create function public.assign_default_apiary() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.apiary_id is null then
    insert into public.apiaries(user_id, name, is_default)
      values(new.user_id, 'Основная пасека', true)
      on conflict (user_id) where is_default do nothing;
    select id into new.apiary_id from public.apiaries
      where user_id = new.user_id and is_default;
  end if;
  return new;
end $$;
revoke all on function public.assign_default_apiary() from public, anon, authenticated;
create trigger hives_assign_default_apiary before insert on public.hives
  for each row execute function public.assign_default_apiary();

create function public.ensure_default_apiary() returns setof public.apiaries
language sql security invoker set search_path = '' as $$
  insert into public.apiaries(user_id, name, is_default)
    values((select auth.uid()), 'Основная пасека', true)
    on conflict (user_id) where is_default do update set user_id = excluded.user_id
    returning *;
$$;
revoke all on function public.ensure_default_apiary() from public, anon;
grant execute on function public.ensure_default_apiary() to authenticated;

do $$ begin
  if exists(select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.apiaries;
  end if;
end $$;

commit;
