import test from 'node:test'
import assert from 'node:assert/strict'
import { createUserHive, deleteUserHive, moveUserHive, normalizeHiveNumber } from '../src/lib/hiveData.js'
import { parseSwarmCount } from '../src/lib/hiveDetails.js'

test('new hives are written directly into their selected apiary with the exact supplied number', async () => {
  let inserted
  const client = { from(table) {
    assert.equal(table, 'hives')
    return { insert(value) { inserted = value; return { select() { return { single: async () => ({ data: { ...value }, error: null }) } } } } }
  } }
  const result = await createUserHive(client, 'owner', ' 35 ', 'apiary')
  assert.deepEqual(inserted, { user_id: 'owner', hive_number: '35', apiary_id: 'apiary' })
  assert.equal(result.hive_number, '35')
  assert.equal(result.apiary_id, 'apiary')
})

test('duplicate hive errors are actionable and never overwrite existing hives', async () => {
  const client = { from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { code: '23505' } }) }) }) }) }
  await assert.rejects(createUserHive(client, 'owner', '1', 'apiary'), /Улей с таким номером уже есть/)
  assert.throws(() => normalizeHiveNumber(''), /Введите номер/)
  assert.throws(() => normalizeHiveNumber('a'.repeat(65)), /Введите номер/)
})

test('moving and deleting are restricted to the current owner and never renumber a hive', async () => {
  const calls = []
  const chain = {
    update(value) { calls.push(['update', value]); return chain },
    delete() { calls.push(['delete']); return chain },
    eq(key, value) { calls.push(['eq', key, value]); return chain },
    select() { return chain },
    single: async () => ({ data: { hive_number: '1', apiary_id: 'destination' }, error: null }),
    then(resolve, reject) { return Promise.resolve({ error: null }).then(resolve, reject) },
  }
  const client = { from: () => chain }
  assert.equal((await moveUserHive(client, 'owner', '1', 'destination')).hive_number, '1')
  await deleteUserHive(client, 'owner', '1')
  assert.deepEqual(calls.filter((call) => call[0] === 'update'), [['update', { apiary_id: 'destination' }]])
  assert.equal(calls.filter((call) => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'owner').length, 2)
})

test('zero or an omitted swarm count is valid and does not need to be entered again', () => {
  for (const value of [0, '0', '', null, undefined]) assert.equal(parseSwarmCount(value), 0)
  assert.equal(parseSwarmCount(7), 7)
  assert.equal(parseSwarmCount('7'), 7)
  for (const value of [-1, '2.5', 'invalid', Infinity]) assert.throws(() => parseSwarmCount(value), /Количество роений/)
})
