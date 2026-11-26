import test from 'node:test'
import assert from 'node:assert/strict'

test('preview enforces hive identity across apiaries and rejects conflicting writes atomically', async () => {
  const storage = new Map()
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  }
  const { query, getRows, PREVIEW_USER_ID } = await import('../preview/store.js')
  const [main, away] = getRows('apiaries')
  const insert = (number, apiary = away.id, owner = PREVIEW_USER_ID) => query('hives')
    .insert({ user_id: owner, hive_number: number, apiary_id: apiary }).select().single()

  assert.equal((await insert('1')).error.code, '23505')
  assert.equal((await insert('Домик')).error, null)
  assert.equal((await insert('Домик', main.id)).error.code, '23505')
  assert.equal((await insert('1', away.id, 'another-owner')).error, null)
  const before = structuredClone(getRows('hives'))
  const batch = await query('hives').insert([
    { user_id: PREVIEW_USER_ID, hive_number: 'New', apiary_id: away.id },
    { user_id: PREVIEW_USER_ID, hive_number: '1', apiary_id: away.id },
  ])
  assert.equal(batch.error.code, '23505')
  assert.deepEqual(getRows('hives'), before)

  // Simulate local data saved by the earlier preview that allowed duplicates.
  const original = getRows('hives').find((row) => row.hive_number === '1' && row.user_id === PREVIEW_USER_ID)
  const legacy = { ...original, id: 'legacy-duplicate', apiary_id: away.id }
  getRows('hives').push(legacy)
  const beforeMove = structuredClone(getRows('hives'))
  const move = await query('hives').update({ apiary_id: main.id })
    .eq('user_id', PREVIEW_USER_ID).eq('hive_number', '1')
  assert.equal(move.error.code, '23505')
  assert.deepEqual(getRows('hives'), beforeMove)
})
