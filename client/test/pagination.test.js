import test from 'node:test'
import assert from 'node:assert/strict'
import { readAllPages } from '../src/lib/pagination.js'

test('loads every apiary beyond Supabase page limits without truncation', async () => {
  const data = Array.from({ length: 1234 }, (_, id) => ({ id }))
  const ranges = []
  const result = await readAllPages(async (from, to) => {
    ranges.push([from, to])
    return { data: data.slice(from, to + 1), error: null }
  })
  assert.deepEqual(result, data)
  assert.deepEqual(ranges, [[0, 499], [500, 999], [1000, 1499]])
})

test('propagates a failure on a later page instead of returning an incomplete list', async () => {
  await assert.rejects(readAllPages(async (from) => from === 0
    ? { data: [{ id: 1 }, { id: 2 }], error: null }
    : { data: null, error: new Error('Connection lost') }, 2), /Connection lost/)
})
