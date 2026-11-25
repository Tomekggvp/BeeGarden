import test from 'node:test'
import assert from 'node:assert/strict'
import axios, { AxiosError } from 'axios'
import { installAuthInterceptors } from '../src/api/auth.js'

const fixture = ({ failedRefresh, alwaysReject = false } = {}) => {
  let session = { access_token: 'old' }, refreshes = 0, requests = 0
  const signOuts = []
  const auth = {
    getSession: async () => ({ data: { session }, error: null }),
    refreshSession: async () => {
      refreshes++
      await new Promise((resolve) => setTimeout(resolve, 5))
      if (failedRefresh) return { data: { session: null }, error: failedRefresh }
      session = { access_token: 'new' }
      return { data: { session }, error: null }
    },
    signOut: async (options) => { signOuts.push(options); session = null },
  }
  const api = axios.create({ adapter: async (config) => {
    requests++
    if (alwaysReject || config.headers.get('Authorization') !== 'Bearer new') {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, { status: 401, data: {}, headers: {}, config })
    }
    return { status: 200, data: Array.from({ length: 34 }, (_, i) => ({ hive_number: String(i + 1) })), headers: {}, config }
  } })
  installAuthInterceptors(api, auth)
  return { api, signOuts, stats: () => ({ refreshes, requests }) }
}

test('reloads all hives after a rejected token is refreshed', async () => {
  const f = fixture()
  const result = await f.api.get('/api/hives')
  assert.equal(result.data.length, 34)
  assert.equal(result.data[0].hive_number, '1')
  assert.equal(result.data[33].hive_number, '34')
  assert.deepEqual(f.stats(), { refreshes: 1, requests: 2 })
})

test('simultaneous unauthorized requests share one refresh', async () => {
  const f = fixture()
  await Promise.all([f.api.get('/api/hives'), f.api.get('/api/weather/location'), f.api.get('/api/other')])
  assert.equal(f.stats().refreshes, 1)
})

test('a revoked session signs out only this browser instead of leaving a false empty apiary', async () => {
  const error = Object.assign(new Error('Session not found'), { status: 400 })
  const f = fixture({ failedRefresh: error })
  await assert.rejects(f.api.get('/api/hives'), (actual) => actual === error)
  assert.deepEqual(f.signOuts, [{ scope: 'local' }])
  assert.equal(f.stats().requests, 1)
})

test('temporary auth network failure preserves the session', async () => {
  const error = Object.assign(new Error('Network unavailable'), { status: 0 })
  const f = fixture({ failedRefresh: error })
  await assert.rejects(f.api.get('/api/hives'), /Network unavailable/)
  assert.deepEqual(f.signOuts, [])
})

test('a second unauthorized response is not retried forever', async () => {
  const f = fixture({ alwaysReject: true })
  await assert.rejects(f.api.get('/api/hives'), (error) => error.response.status === 401)
  assert.deepEqual(f.stats(), { refreshes: 1, requests: 2 })
})
