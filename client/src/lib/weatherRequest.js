export const requestWeather = async ({ latitude, longitude, signal }, getWeather, fetchWeather = fetch) => {
  try {
    return await getWeather()
  } catch (error) {
    const status = error.response?.status
    if (signal?.aborted || error.code === 'ERR_CANCELED'
      || (status && ![429, 500, 502, 503, 504].includes(status))) throw error
  }

  // Shared hosting egress can be unavailable while the user's browser works.
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.search = new URLSearchParams({
    latitude: String(latitude), longitude: String(longitude),
    current: 'temperature_2m,is_day,wind_speed_10m',
    hourly: 'precipitation_probability', forecast_hours: '24', timezone: 'auto',
  })
  const controller = new AbortController()
  const abort = () => controller.abort()
  const timeout = setTimeout(abort, 8000)
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) controller.abort()
  try {
    const response = await fetchWeather(url, { signal: controller.signal, credentials: 'omit', redirect: 'error' })
    if (!response.ok) throw new Error('Не удалось загрузить погоду. Попробуйте позже.')
    return await response.json()
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}
