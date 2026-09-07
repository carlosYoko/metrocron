import { useCallback, useEffect, useRef, useState } from 'react'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export function useTimer(initialSeconds = 3 * 60) {
  const [duration, setDuration] = useState(initialSeconds)
  const [remaining, setRemaining] = useState(initialSeconds)
  const [status, setStatus] = useState('idle')
  const endTimeRef = useRef(0)

  useEffect(() => {
    if (status !== 'running') return undefined

    const updateRemaining = () => {
      const nextRemaining = Math.max(0, Math.ceil((endTimeRef.current - performance.now()) / 1000))
      setRemaining(nextRemaining)

      if (nextRemaining === 0) setStatus('finished')
    }

    const interval = window.setInterval(updateRemaining, 100)
    updateRemaining()
    return () => window.clearInterval(interval)
  }, [status])

  const start = useCallback(() => {
    const secondsToRun = remaining > 0 ? remaining : duration
    if (secondsToRun <= 0) return
    setRemaining(secondsToRun)
    endTimeRef.current = performance.now() + secondsToRun * 1000
    setStatus('running')
  }, [duration, remaining])

  const pause = useCallback(() => {
    if (status !== 'running') return
    const nextRemaining = Math.max(0, Math.ceil((endTimeRef.current - performance.now()) / 1000))
    setRemaining(nextRemaining)
    setStatus(nextRemaining > 0 ? 'paused' : 'finished')
  }, [status])

  const reset = useCallback(() => {
    setRemaining(duration)
    setStatus('idle')
  }, [duration])

  const setTime = useCallback((minutes, seconds) => {
    const nextMinutes = clamp(Number(minutes) || 0, 0, 99)
    const nextSeconds = clamp(Number(seconds) || 0, 0, 59)
    const total = nextMinutes * 60 + nextSeconds
    setDuration(total)
    setRemaining(total)
    setStatus('idle')
  }, [])

  return {
    duration,
    remaining,
    status,
    isRunning: status === 'running',
    progress: duration > 0 ? remaining / duration : 0,
    start,
    pause,
    reset,
    setTime,
  }
}
