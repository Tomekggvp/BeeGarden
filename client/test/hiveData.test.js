import test from 'node:test'
import assert from 'node:assert/strict'
import { loadUserHives } from '../src/lib/hiveData.js'
import { readApiaryCache, writeApiaryCache } from '../src/lib/apiaryCache.js'

test('reads the entire owned hive list directly from the database without Render', async () => {
  const rows = Array.from({ length: 1034 }, (_, i) => ({ hive_number: String(i + 1), apiary_id: 'main' }))
  const seen = []
  const signal = new AbortController().signal
  const client = { from(table) {
    assert.equal(table, 'hives')
    let range
    const query = {
      select(columns) { assert.ok(columns.includes('apiary_id')); return query },
      eq(key, value) { assert.equal(key, 'user_id'); assert.equal(value, 'owner'); return query },
      order() { return query },
      range(from, to) { range = [from, to]; seen.push(range); return query },
      abortSignal(value) { assert.equal(value, signal); return query },
      then(resolve, reject) { return Promise.resolve({ data: rows.slice(range[0], range[1] + 1), error: null }).then(resolve, reject) },
    }
    return query
  } }
  assert.deepEqual(await loadUserHives(client, 'owner', signal), rows)
  assert.equal(seen.length, 3)
})

test('cached apiaries survive unavailable metadata and remain scoped to their owner', () => {
  const data = new Map()
  const storage = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) }
  const rows = [{ id: 'main', name: 'Основная пасека', is_default: true }]
  writeApiaryCache('owner', rows, storage)
  assert.deepEqual(readApiaryCache('owner', storage), rows)
  assert.deepEqual(readApiaryCache('other-user', storage), [])
  const hives = Array.from({ length: 34 }, (_, i) => ({ id: String(i + 1), apiaryId: 'main' }))
  assert.equal(hives.filter((hive) => hive.apiaryId === readApiaryCache('owner', storage)[0].id).length, 34)
})

test('blocked or corrupt local storage does not crash loading', () => {
  const storage = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
  assert.deepEqual(readApiaryCache('owner', storage), [])
  assert.doesNotThrow(() => writeApiaryCache('owner', [], storage))
  assert.deepEqual(readApiaryCache('owner', { getItem: () => '{broken' }), [])
})
