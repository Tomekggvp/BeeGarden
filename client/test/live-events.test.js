import test from 'node:test'
import assert from 'node:assert/strict'
import { dispatchDataChange, subscribeDataChange } from '../src/lib/liveEvents.js'

test('live invalidations respect account/table scope, reconnect snapshots and unsubscribe', () => {
  const original = globalThis.window
  globalThis.window = new EventTarget()
  try {
    let refreshes = 0
    const unsubscribe = subscribeDataChange('owner', ['hives', 'tasks'], () => { refreshes++ })
    dispatchDataChange('other', 'hives')
    dispatchDataChange('owner', 'apiaries')
    assert.equal(refreshes, 0)
    dispatchDataChange('owner', 'hives')
    dispatchDataChange('owner', 'tasks')
    dispatchDataChange('owner')
    assert.equal(refreshes, 3)
    unsubscribe()
    dispatchDataChange('owner', 'hives')
    assert.equal(refreshes, 3)
  } finally {
    if (original === undefined) delete globalThis.window
    else globalThis.window = original
  }
})
