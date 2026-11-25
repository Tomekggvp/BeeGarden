import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const owner = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
const tables = ['hives', 'apiaries', 'beehive_details', 'tasks', 'hive_checks', 'honey_pumpings', 'treatments', 'task_notification_history', 'push_subscriptions', 'user_locations']
const migration = readFileSync(new URL('../../supabase/migrations/20261125203211_account_live_sync.sql', import.meta.url), 'utf8')
const policyMigration = readFileSync(new URL('../../supabase/migrations/20261125203952_scope_account_broadcast_messages.sql', import.meta.url), 'utf8')

test('private account broadcasts on isolated PostgreSQL', async (t) => {
  const db = new PGlite()
  try {
    await db.exec(`
      create role authenticated; create role anon; create role service_role;
      create schema auth; create schema realtime;
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
      $$;
      create function realtime.topic() returns text language sql stable as $$
        select current_setting('realtime.topic',true);
      $$;
      create table realtime.messages(extension text,payload jsonb,event text,topic text,private boolean);
      alter table realtime.messages enable row level security;
      grant usage on schema auth,realtime to authenticated,anon;
      grant select on realtime.messages to authenticated,anon;
      create function realtime.send(payload jsonb,event text,topic text,private boolean) returns void language sql as $$
        insert into realtime.messages values('broadcast',payload,event,topic,private);
      $$;
    `)
    for (const table of tables) {
      await db.exec(`create table public.${table}(user_id text,note text)`)
    }
    await db.exec(migration)
    await db.exec(policyMigration)

    await t.test('every account table emits inserts, changes and deletes without exposing records', async () => {
      for (const table of tables) {
        await db.query(`insert into public.${table} values($1,'secret contents')`, [owner])
        await db.exec(`update public.${table} set note='changed'; delete from public.${table}`)
      }
      const rows = (await db.query('select * from realtime.messages')).rows
      assert.equal(rows.length, tables.length * 3)
      for (const row of rows) {
        assert.deepEqual(Object.keys(row.payload), ['table'])
        assert.ok(tables.includes(row.payload.table))
        assert.equal(row.topic, `account:${owner}`)
        assert.equal(row.event, 'data_changed')
        assert.equal(row.private, true)
      }
    })

    await t.test('no-op default apiary updates cannot trigger a refresh feedback loop', async () => {
      await db.query('insert into public.apiaries values($1,\'Main\')', [owner])
      const before = (await db.query('select count(*)::int n from realtime.messages')).rows[0].n
      await db.exec('update public.apiaries set user_id=user_id')
      assert.equal((await db.query('select count(*)::int n from realtime.messages')).rows[0].n, before)
    })

    await t.test('owner changes notify both accounts and nullable legacy owners are safe', async () => {
      await db.query('update public.apiaries set user_id=$1', [other])
      const rows = (await db.query("select topic from realtime.messages where payload->>'table'='apiaries'")).rows
      assert.equal(rows.at(-2).topic, `account:${other}`)
      assert.equal(rows.at(-1).topic, `account:${owner}`)
      await db.exec("insert into public.tasks values(null,'legacy')")
      await db.query('update public.tasks set user_id=$1', [owner])
    })

    await t.test('RLS allows receiving only the signed-in account channel', async () => {
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner])
      await db.query("select set_config('realtime.topic',$1,false)", [`account:${owner}`])
      await db.exec('set role authenticated')
      const rows = (await db.query('select * from realtime.messages')).rows
      assert.ok(rows.length > 0)
      assert.ok(rows.every((row) => row.topic === `account:${owner}`))
      await db.query("select set_config('realtime.topic',$1,false)", [`account:${other}`])
      assert.equal((await db.query('select * from realtime.messages')).rows.length, 0)
      await assert.rejects(db.query('select private.notify_account_change()'), (error) => error.code === '42501')
      await db.exec('reset role; set role anon')
      assert.equal((await db.query('select * from realtime.messages')).rows.length, 0)
    })
  } finally {
    await db.close()
  }
})
