import { useCallback, useEffect, useRef, useState } from 'react'
import { SOUND_PRESETS } from '../config/metronome.js'

const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_SECONDS = 0.1
const OUTPUT_BOOST = 4

export function useMetronome({ playing, bpm, beatsPerBar, soundId, volume, accentFirstBeat }) {
  const audioContextRef = useRef(null)
  const masterGainRef = useRef(null)
  const workletNodeRef = useRef(null)
  const workletFailedRef = useRef(false)
  const timerAlarmRef = useRef(null)
  const playingRef = useRef(playing)
  const settingsRef = useRef({ bpm, beatsPerBar, soundId, volume, accentFirstBeat })
  const volumeRef = useRef(volume)
  const accentFirstBeatRef = useRef(accentFirstBeat)
  const nextNoteTimeRef = useRef(0)
  const nextBeatRef = useRef(0)
  const visualTimersRef = useRef([])
  const [currentBeat, setCurrentBeat] = useState(-1)
  const [backgroundAudioAvailable, setBackgroundAudioAvailable] = useState(false)

  const syncWorklet = useCallback(() => {
    const node = workletNodeRef.current
    if (!node) return

    const { bpm: currentBpm, beatsPerBar: currentBeatsPerBar, soundId: currentSoundId, volume: currentVolume, accentFirstBeat: currentAccentFirstBeat } = settingsRef.current
    const preset = SOUND_PRESETS.find((item) => item.id === currentSoundId) ?? SOUND_PRESETS[0]
    node.port.postMessage({
      type: 'settings',
      bpm: currentBpm,
      beatsPerBar: currentBeatsPerBar,
      wave: preset.wave,
      frequency: preset.frequency,
      accent: preset.accent,
      duration: preset.duration,
      pulseVolume: preset.volume,
      volume: currentVolume / 100,
      accentFirstBeat: currentAccentFirstBeat,
      playing: playingRef.current,
    })
    if (timerAlarmRef.current !== null) {
      node.port.postMessage({ type: 'schedule-alarm', seconds: timerAlarmRef.current })
      timerAlarmRef.current = null
    }
  }, [])

  const prepareAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      audioContextRef.current = new AudioContext()
      masterGainRef.current = audioContextRef.current.createGain()
      masterGainRef.current.gain.value = (volumeRef.current / 100) * OUTPUT_BOOST
      const compressor = audioContextRef.current.createDynamicsCompressor()
      compressor.threshold.value = -1
      compressor.knee.value = 0
      compressor.ratio.value = 20
      compressor.attack.value = 0.001
      compressor.release.value = 0.1
      masterGainRef.current.connect(compressor)
      compressor.connect(audioContextRef.current.destination)

      if (audioContextRef.current.audioWorklet && window.AudioWorkletNode) {
        setBackgroundAudioAvailable(true)
        audioContextRef.current.audioWorklet
          .addModule(`${import.meta.env.BASE_URL}metronome-processor.js`)
          .then(() => {
            const node = new AudioWorkletNode(audioContextRef.current, 'metrocron-audio')
            node.connect(masterGainRef.current)
            workletNodeRef.current = node
            syncWorklet()
          })
          .catch((error) => {
            workletFailedRef.current = true
            setBackgroundAudioAvailable(false)
            console.error('No se pudo iniciar el audio en segundo plano.', error)
          })
      } else {
        workletFailedRef.current = true
      }
    }
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume()
    return audioContextRef.current
  }, [syncWorklet])

  useEffect(() => {
    volumeRef.current = volume
    accentFirstBeatRef.current = accentFirstBeat
    settingsRef.current = { bpm, beatsPerBar, soundId, volume, accentFirstBeat }
    const context = audioContextRef.current
    if (context && masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime((volume / 100) * OUTPUT_BOOST, context.currentTime, 0.015)
    }
    syncWorklet()
  }, [accentFirstBeat, beatsPerBar, bpm, soundId, syncWorklet, volume])

  useEffect(() => {
    playingRef.current = playing
    syncWorklet()
  }, [playing, syncWorklet])

  const scheduleTimerAlarm = useCallback((seconds) => {
    timerAlarmRef.current = seconds
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({ type: 'schedule-alarm', seconds })
      timerAlarmRef.current = null
    }
  }, [])

  const cancelTimerAlarm = useCallback(() => {
    timerAlarmRef.current = null
    workletNodeRef.current?.port.postMessage({ type: 'cancel-alarm' })
  }, [])

  const playCompletionAlarm = useCallback(() => {
    const context = prepareAudio()
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({ type: 'play-alarm' })
      return
    }
    const startTime = context.currentTime + 0.04
    const notes = [
      { frequency: 659.25, offset: 0, duration: 0.3 },
      { frequency: 783.99, offset: 0.3, duration: 0.3 },
      { frequency: 1046.5, offset: 0.6, duration: 0.65 },
    ]

    notes.forEach(({ frequency, offset, duration }) => {
      const noteStart = startTime + offset
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, noteStart)
      gain.gain.setValueAtTime(0.0001, noteStart)
      gain.gain.exponentialRampToValueAtTime(0.24, noteStart + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration)
      oscillator.connect(gain)
      gain.connect(masterGainRef.current)
      oscillator.start(noteStart)
      oscillator.stop(noteStart + duration)
    })
  }, [prepareAudio])

  useEffect(() => {
    if (!playing) {
      nextBeatRef.current = 0
      return undefined
    }

    prepareAudio()
    const context = audioContextRef.current
    const preset = SOUND_PRESETS.find((item) => item.id === soundId) ?? SOUND_PRESETS[0]
    nextNoteTimeRef.current = context.currentTime + 0.05
    nextBeatRef.current = 0

    const schedulePulse = (beat, time) => {
      const isAccent = accentFirstBeatRef.current && beat === 0
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = preset.wave
      oscillator.frequency.setValueAtTime(isAccent ? preset.accent : preset.frequency, time)
      gain.gain.setValueAtTime(preset.volume * (isAccent ? 1 : 0.72), time)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + preset.duration)
      oscillator.connect(gain)
      gain.connect(masterGainRef.current)
      oscillator.start(time)
      oscillator.stop(time + preset.duration)

      const visualDelay = Math.max(0, (time - context.currentTime) * 1000)
      const timer = window.setTimeout(() => setCurrentBeat(beat), visualDelay)
      visualTimersRef.current.push(timer)
    }

    const scheduler = () => {
      if (nextNoteTimeRef.current < context.currentTime - SCHEDULE_AHEAD_SECONDS) {
        nextNoteTimeRef.current = context.currentTime + 0.05
        nextBeatRef.current = 0
      }
      while (nextNoteTimeRef.current < context.currentTime + SCHEDULE_AHEAD_SECONDS) {
        if (!workletNodeRef.current && workletFailedRef.current) schedulePulse(nextBeatRef.current, nextNoteTimeRef.current)
        else {
          const visualDelay = Math.max(0, (nextNoteTimeRef.current - context.currentTime) * 1000)
          const beat = nextBeatRef.current
          const timer = window.setTimeout(() => setCurrentBeat(beat), visualDelay)
          visualTimersRef.current.push(timer)
        }
        nextNoteTimeRef.current += 60 / bpm
        nextBeatRef.current = (nextBeatRef.current + 1) % beatsPerBar
      }
    }

    scheduler()
    const interval = window.setInterval(scheduler, LOOKAHEAD_MS)

    return () => {
      window.clearInterval(interval)
      visualTimersRef.current.forEach(window.clearTimeout)
      visualTimersRef.current = []
    }
  }, [backgroundAudioAvailable, beatsPerBar, bpm, playing, prepareAudio, soundId])

  return { currentBeat, prepareAudio, playCompletionAlarm, scheduleTimerAlarm, cancelTimerAlarm, backgroundAudioAvailable }
}
