export const APP_VERSION = 'audio-4'

export async function refreshApplication() {
  // Comprobar la conexión antes de eliminar los archivos sin conexión.
  const response = await fetch(import.meta.env.BASE_URL, { cache: 'no-store' })
  if (!response.ok) throw new Error('No se pudo descargar la aplicación.')

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL)
    await registration?.unregister()
  }
  if ('caches' in window) {
    const names = await caches.keys()
    await Promise.all(names.filter((name) => name.startsWith('metrocron-')).map((name) => caches.delete(name)))
  }
  // No se modifica localStorage: se conservan los ajustes del usuario.
  window.location.reload()
}
