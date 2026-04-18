// Push notification service worker
// Handles incoming push events and notification clicks

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title || 'Not-To-Do'
  const options = {
    body: data.body || '今日記得 check in 呀！',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ntd-daily-reminder',
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus()
          }
        }
        return clients.openWindow(url)
      })
  )
})
