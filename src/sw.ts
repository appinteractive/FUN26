/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core"
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching"

declare const self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()
// Pages are precached under clean URLs without a trailing slash
// (e.g. /schedule/foo). Map trailing-slash navigations onto them.
precacheAndRoute(self.__WB_MANIFEST, {
  // Share links navigate to "/?fav=…" — serve the precached page anyway.
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^fav$/],
  urlManipulation: ({ url }) => {
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      const stripped = new URL(url.href)
      stripped.pathname = stripped.pathname.replace(/\/+$/, "")
      return [stripped]
    }
    return []
  },
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url: string = event.notification.data?.url ?? "/"
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      for (const client of windows) {
        await client.focus()
        if ("navigate" in client) await client.navigate(url)
        return
      }
      await self.clients.openWindow(url)
    })()
  )
})
