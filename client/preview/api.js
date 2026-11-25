import { PREVIEW_USER_ID, getRows, query } from './store'
const fail = (status, message) => { throw Object.assign(new Error(message), { response: { status, data: { error: message } } }) }
const api = {
  async get(path, options = {}) {
    if (options.signal?.aborted) throw Object.assign(new Error('Cancelled'), { code: 'ERR_CANCELED' })
    if (path === '/api/hives') return { data: structuredClone(getRows('hives')) }
    if (path === '/api/weather/location') return fail(503, 'Use browser weather in preview')
    if (path === '/api/push/vapid-public-key') return fail(503, 'Push disabled in local preview')
    return fail(404, 'Not available in preview')
  },
  async post(path, body) {
    if (path === '/api/hives') {
      if (getRows('hives').some((row) => row.hive_number === body.hive_number)) return fail(409, 'Улей с таким номером уже есть в другой пасеке. Его можно перенести через карточку.')
      const { data } = await query('hives').insert({ ...body, user_id: PREVIEW_USER_ID }).single()
      return { data }
    }
    if (path === '/api/check-notifications/send') return { data: { sent: false } }
    return fail(503, 'Push disabled in local preview')
  },
  async patch(path, body) {
    const number = decodeURIComponent(path.split('/')[3])
    if (!getRows('apiaries').some((row) => row.id === body.apiary_id)) return fail(404, 'Пасека не найдена.')
    const { data } = await query('hives').update({ apiary_id: body.apiary_id }).eq('hive_number', number).single()
    return { data }
  },
  async delete(path) {
    if (path === '/api/push/subscribe') return { data: { success: true } }
    await query('hives').delete().eq('hive_number', decodeURIComponent(path.split('/')[3]))
    return { data: { success: true } }
  },
}
export default api
