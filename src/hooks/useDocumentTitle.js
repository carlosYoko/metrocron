import { useEffect } from 'react'

const DEFAULT_TITLE = 'Metrocron — Tu tiempo, a tempo'

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function useDocumentTitle({ remaining, status }) {
  useEffect(() => {
    if (status === 'running') document.title = `${formatTime(remaining)} · Metrocron`
    else if (status === 'paused') document.title = `${formatTime(remaining)} · En pausa`
    else if (status === 'finished') document.title = 'Sesión completada · Metrocron'
    else document.title = DEFAULT_TITLE

    return () => { document.title = DEFAULT_TITLE }
  }, [remaining, status])
}
