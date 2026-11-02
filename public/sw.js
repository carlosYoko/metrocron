const CACHE_NAME = 'metrocron-v1'
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/metronome-processor.js',
  '/pwa-192.png',
  '/pwa-512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await cache.addAll(APP_SHELL)
      const appShell = await cache.match('/')
      const html = await appShell.text()
      const assets = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))(?:\?[^"']*)?["']/g)]
        .map(([, asset]) => asset)
      await cache.addAll(assets)
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('metrocron-') && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    const networkResponse = fetch(request).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME)
        await cache.put('/', response.clone())
      }
      return response
    })
    event.respondWith(
      networkResponse.catch(async () => (await caches.match('/')) ?? Response.error()),
    )
    event.waitUntil(networkResponse.then(() => undefined, () => undefined))
    return
  }

  const response = caches.match(request, { ignoreVary: true }).then(async (cached) => {
    if (cached) return cached
    const network = await fetch(request)
    if (network.ok) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(request, network.clone())
    }
    return network
  })
  event.respondWith(response)
  event.waitUntil(response.then(() => undefined, () => undefined))
})
