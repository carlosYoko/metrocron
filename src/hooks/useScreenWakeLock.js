import { useEffect, useRef, useState } from 'react'

export function useScreenWakeLock(active) {
  const wakeLockRef = useRef(null)
  const pendingRequestRef = useRef(null)
  const activeRef = useRef(active)
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    activeRef.current = active

    if (!active) {
      return undefined
    }

    let disposed = false

    const requestWakeLock = async () => {
      if (!activeRef.current || document.visibilityState !== 'visible') return
      if (!('wakeLock' in navigator)) {
        setStatus('unsupported')
        return
      }
      if (wakeLockRef.current && !wakeLockRef.current.released) return
      if (pendingRequestRef.current) return

      let request
      try {
        request = navigator.wakeLock.request('screen')
        pendingRequestRef.current = request
        const sentinel = await request
        if (pendingRequestRef.current === request) pendingRequestRef.current = null

        if (disposed || !activeRef.current || document.visibilityState !== 'visible') {
          await sentinel.release()
          return
        }

        wakeLockRef.current = sentinel
        setStatus('active')
        sentinel.addEventListener('release', () => {
          if (wakeLockRef.current === sentinel) wakeLockRef.current = null
          if (!disposed && activeRef.current && document.visibilityState === 'visible') {
            setStatus('unavailable')
          }
        }, { once: true })
      } catch (error) {
        if (request && pendingRequestRef.current === request) pendingRequestRef.current = null
        if (!disposed && activeRef.current && document.visibilityState === 'visible') {
          setStatus('unavailable')
          console.warn('No se pudo mantener la pantalla encendida.', error)
        }
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void requestWakeLock()
      } else {
        setStatus('waiting')
      }
    }

    void requestWakeLock()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      pendingRequestRef.current = null
      const sentinel = wakeLockRef.current
      wakeLockRef.current = null
      if (sentinel && !sentinel.released) {
        sentinel.release().catch((error) => {
          console.error('No se pudo liberar el bloqueo de pantalla.', error)
        })
      }
    }
  }, [active])

  return active ? status : 'idle'
}
