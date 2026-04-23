self.addEventListener('push', (event) => {
  let data = {}

  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {
      title: 'BeeGarden',
      body: event.data ? event.data.text() : 'Напоминание',
    }
  }

  const title = data.title || 'BeeGarden'
  const options = {
    body: data.body || 'Напоминание',
    icon: data.icon || '/bee.png',
    badge: '/bee.png',
    tag: data.tag || 'beegarden-reminder',
    data: {
      url: data.url || '/',
    },
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href
  const targetPathname = new URL(targetUrl).pathname

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) => {
        try {
          return new URL(client.url).pathname === targetPathname
        } catch {
          return false
        }
      })

      if (existingClient) {
        return existingClient.focus()
      }

      return self.clients.openWindow(targetUrl)
    })
  )
})
