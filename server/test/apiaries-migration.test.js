import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const owner = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
const newcomer = '33333333-3333-4333-8333-333333333333'
const migration = readFileSync(new URL('../../supabase/migrations/20261125193128_multiple_apiaries.sql', import.meta.url), 'utf8')

test('multiple apiaries migration on isolated PostgreSQL', async (t) => {
  const db = new PGlite()
  const asOwner = async () => {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner])
    await db.exec('set role authenticated')
  }
  try {
    await db.exec(`
      create role authenticated; create role anon; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
      $$;
      grant usage on schema public, auth to authenticated, anon, service_role;
      create table public.hives(id uuid primary key default gen_random_uuid(), user_id uuid not null, hive_number text not null,
        created_at timestamptz default now(), unique(user_id,hive_number));
      alter table public.hives enable row level security;
      create policy hive_owner on public.hives to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
      grant select,insert,update,delete on public.hives to authenticated;
      create table public.user_locations(user_id text primary key,latitude double precision,longitude double precision,saved_at timestamptz);
      create table public.beehive_details(user_id uuid,hive_id text,custom_note text);
      insert into auth.users values('${owner}'),('${other}');
      insert into public.hives(user_id,hive_number) values('${owner}','1'),('${other}','1');
      insert into public.beehive_details values('${owner}','1','Preserve this history');
      insert into public.user_locations values('${owner}',0,30,now());
    `)
    await db.exec(migration)
    const main = (await db.query('select * from public.apiaries where user_id=$1', [owner])).rows[0]
    const foreign = (await db.query('select * from public.apiaries where user_id=$1', [other])).rows[0]
    const originalHive = (await db.query('select * from public.hives where user_id=$1', [owner])).rows[0]

    await t.test('preserves all hives, their numbers, existing locations and details', async () => {
      assert.equal((await db.query('select * from public.hives')).rows.length, 2)
      assert.equal(originalHive.hive_number, '1')
      assert.equal(originalHive.apiary_id, main.id)
      assert.equal(main.latitude, 0)
      assert.equal(main.longitude, 30)
      assert.equal((await db.query('select * from public.beehive_details')).rows[0].custom_note, 'Preserve this history')
    })

    await asOwner()
    const destination = (await db.query("insert into public.apiaries(user_id,name,latitude,longitude) values($1,'Выездная',55,37) returning *", [owner])).rows[0]
    await t.test('moving a hive preserves its identity and number and changes only its apiary', async () => {
      const moved = (await db.query('update public.hives set apiary_id=$1 where id=$2 returning *', [destination.id, originalHive.id])).rows[0]
      assert.deepEqual(moved, { ...originalHive, apiary_id: destination.id })
      assert.equal((await db.query('select * from public.apiaries')).rows.length, 2)
    })

    await t.test('separate apiaries keep separate coordinates, including zero coordinates', async () => {
      await db.query('update public.apiaries set latitude=0,longitude=0 where id=$1', [main.id])
      const rows = (await db.query('select * from public.apiaries')).rows
      assert.equal(rows.find((row) => row.id === main.id).latitude, 0)
      assert.equal(rows.find((row) => row.id === destination.id).latitude, 55)
      await assert.rejects(db.query('update public.apiaries set latitude=91 where id=$1', [main.id]), (error) => error.code === '23514')
    })

    await t.test('RLS and composite foreign key reject another user\'s places', async () => {
      assert.equal((await db.query('select * from public.apiaries where id=$1', [foreign.id])).rows.length, 0)
      assert.equal((await db.query("update public.apiaries set name='Denied' where id=$1 returning id", [foreign.id])).rows.length, 0)
      await assert.rejects(db.query("insert into public.apiaries(user_id,name) values($1,'Denied')", [other]), (error) => error.code === '42501')
      await assert.rejects(db.query('update public.hives set apiary_id=$1 where id=$2', [foreign.id, originalHive.id]), (error) => error.code === '23503')
    })

    await t.test('there is no application limit of 1000 apiaries', async () => {
      await db.query("insert into public.apiaries(user_id,name) select $1::uuid,'Тест '||i from generate_series(1,1050) i", [owner])
      assert.equal(Number((await db.query('select count(*) as count from public.apiaries')).rows[0].count), 1052)
    })

    await t.test('legacy hive creation assigns the default apiary and keeps the supplied number', async () => {
      const row = (await db.query("insert into public.hives(user_id,hive_number) values($1,'777') returning *", [owner])).rows[0]
      assert.equal(row.apiary_id, main.id)
      assert.equal(row.hive_number, '777')
      await assert.rejects(db.query('delete from public.apiaries where id=$1', [main.id]), (error) => ['23503', '23001'].includes(error.code) && error.constraint === 'hives_apiary_owner_fkey')
    })

    await t.test('default creation is idempotent for new users and anonymous access is denied', async () => {
      await db.exec('reset role')
      await db.query('insert into auth.users values($1)', [newcomer])
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [newcomer])
      await db.exec('set role authenticated')
      const a = (await db.query('select * from public.ensure_default_apiary()')).rows[0]
      const b = (await db.query('select * from public.ensure_default_apiary()')).rows[0]
      assert.equal(a.id, b.id)
      assert.equal(a.user_id, newcomer)
      await db.exec('reset role; set role anon')
      await assert.rejects(db.query('select * from public.apiaries'), (error) => error.code === '42501')
      await assert.rejects(db.query('select * from public.ensure_default_apiary()'), (error) => error.code === '42501')
    })
  } finally { await db.close() }
})
