const formatReminderDate = (value) => {
  if (!value) return ''

  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return ''
  }
}

const buildBody = (payload) => {
  const parts = []

  if (payload.taskText) {
    parts.push(payload.taskText)
  } else if (payload.body) {
    parts.push(payload.body)
  }

  const formattedDate = formatReminderDate(payload.reminderAt)
  if (formattedDate) {
    parts.push(`Время: ${formattedDate}`)
  }

  return parts.join('\n') || 'Напоминание'
}

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
    body: buildBody(data),
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
