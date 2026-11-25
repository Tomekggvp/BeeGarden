import test from 'node:test'
import assert from 'node:assert/strict'
import { requestWeather } from '../src/lib/weatherRequest.js'

const location = { latitude: 0, longitude: 0 }
const unavailable = async () => { throw { response: { status: 502 } } }

test('uses successful API response without contacting another endpoint', async () => {
  const data = { current: { temperature_2m: 12 } }
  assert.equal(await requestWeather(location, async () => data, () => assert.fail('Unexpected fallback')), data)
})

test('weather fallback handles a blocked hosting provider, preserves zero coordinates and omits credentials', async () => {
  const result = await requestWeather(location, unavailable, async (url, options) => {
    assert.equal(url.origin, 'https://api.open-meteo.com')
    assert.equal(url.searchParams.get('latitude'), '0')
    assert.equal(url.searchParams.get('longitude'), '0')
    assert.equal(options.credentials, 'omit')
    assert.equal(options.redirect, 'error')
    assert.ok(options.signal)
    return Response.json({ current: { temperature_2m: 12 } })
  })
  assert.equal(result.current.temperature_2m, 12)
})

test('does not fall back for invalid requests or authentication errors', async () => {
  for (const status of [400, 401, 403]) {
    const error = { response: { status } }
    await assert.rejects(requestWeather(location, async () => { throw error }, () => assert.fail('Unexpected fallback')), (actual) => actual === error)
  }
})

test('cancellation prevents fallback and propagates to a pending browser fetch', async () => {
  const canceled = new AbortController()
  canceled.abort()
  await assert.rejects(requestWeather({ ...location, signal: canceled.signal }, unavailable, () => assert.fail('Unexpected fallback')))
  const controller = new AbortController()
  await requestWeather({ ...location, signal: controller.signal }, unavailable, async (_url, options) => {
    controller.abort()
    assert.equal(options.signal.aborted, true)
    return Response.json({})
  })
})

test('upstream error bodies are not exposed through fallback failures', async () => {
  await assert.rejects(requestWeather(location, unavailable, async () => new Response('private diagnostic', { status: 503 })), /Не удалось загрузить погоду/)
})
