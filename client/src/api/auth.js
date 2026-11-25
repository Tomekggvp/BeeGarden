export const installAuthInterceptors = (api, auth) => {
  let refreshing = null
  api.interceptors.request.use(async (config) => {
    const { data: { session }, error } = await auth.getSession()
    if (error) throw error
    if (session?.access_token) config.headers.set('Authorization', `Bearer ${session.access_token}`)
    return config
  })
  api.interceptors.response.use((response) => response, async (error) => {
    const config = error.config
    if (error.response?.status !== 401 || !config || config.authRetried || config.signal?.aborted) throw error
    config.authRetried = true
    const { data: { session: latest } } = await auth.getSession()
    if (latest?.access_token && config.headers.get('Authorization') !== `Bearer ${latest.access_token}`) {
      return api.request(config)
    }
    if (!refreshing) {
      refreshing = auth.refreshSession().then(async ({ data, error }) => {
        if (error || !data?.session?.access_token) {
          if (!error || [400, 401, 403].includes(error.status)) {
            await auth.signOut({ scope: 'local' })
          }
          throw error || new Error('Сессия завершена. Войдите снова.')
        }
        return data.session
      }).finally(() => { refreshing = null })
    }
    await refreshing
    return api.request(config)
  })
}
