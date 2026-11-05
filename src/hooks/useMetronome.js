import { useCallback, useEffect, useRef, useState } from 'react'
import { getRhythm, SOUND_PRESETS } from '../config/metronome.js'
import processorSource from '../audio/metronome-processor.js?raw'

const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_SECONDS = 0.1

export function useMetronome({ playing, bpm, beatsPerBar, rhythmId, soundId, volume, accentFirstBeat }) {
  const audioContextRef = useRef(null)
  const masterGainRef = useRef(null)
  const workletNodeRef = useRef(null)
  const workletFailedRef = useRef(false)
  const timerAlarmRef = useRef(null)
  const playingRef = useRef(playing)
  const settingsRef = useRef({ bpm, beatsPerBar, rhythmId, soundId, volume, accentFirstBeat })
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
    const rhythm = getRhythm(settingsRef.current.rhythmId)
    const preset = SOUND_PRESETS.find((item) => item.id === currentSoundId) ?? SOUND_PRESETS[0]
    node.port.postMessage({
      type: 'settings',
      bpm: currentBpm,
      beatsPerBar: currentBeatsPerBar,
      rhythmBeats: rhythm.beats,
      rhythmDivisions: rhythm.divisions,
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
      // Ganancia unitaria al 100 %: sin refuerzo ni compresión dinámica.
      masterGainRef.current.gain.value = volumeRef.current / 100
      masterGainRef.current.connect(audioContextRef.current.destination)

      if (audioContextRef.current.audioWorklet && window.AudioWorkletNode) {
        setBackgroundAudioAvailable(true)
        // El procesador se incluye en el bundle para que la PWA no cargue
        // una versión antigua del motor junto a una interfaz nueva.
        const processorUrl = URL.createObjectURL(new Blob([processorSource], { type: 'text/javascript' }))
        audioContextRef.current.audioWorklet
          .addModule(processorUrl)
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
          .finally(() => URL.revokeObjectURL(processorUrl))
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
    settingsRef.current = { bpm, beatsPerBar, rhythmId, soundId, volume, accentFirstBeat }
    const context = audioContextRef.current
    if (context && masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume / 100, context.currentTime, 0.015)
    }
    syncWorklet()
  }, [accentFirstBeat, beatsPerBar, bpm, rhythmId, soundId, syncWorklet, volume])

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

    const rhythm = getRhythm(rhythmId)
    let nextPulseTime = nextNoteTimeRef.current
    let pulseIndex = 0
    const pulsesPerBar = Math.ceil(beatsPerBar * rhythm.divisions / rhythm.beats)
    const pulseStep = rhythm.beats / rhythm.divisions

    const schedulePulse = (index, time) => {
      const isAccent = accentFirstBeatRef.current && index % pulsesPerBar === 0
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

    }

    const scheduler = () => {
      if (nextNoteTimeRef.current < context.currentTime - SCHEDULE_AHEAD_SECONDS) {
        nextNoteTimeRef.current = context.currentTime + 0.05
        nextBeatRef.current = 0
        nextPulseTime = nextNoteTimeRef.current
        pulseIndex = 0
      }
      while (nextPulseTime < context.currentTime + SCHEDULE_AHEAD_SECONDS) {
        if (!workletNodeRef.current && workletFailedRef.current) schedulePulse(pulseIndex, nextPulseTime)
        const remainingBeats = beatsPerBar - (pulseIndex % pulsesPerBar) * pulseStep
        nextPulseTime += (60 / bpm) * Math.min(pulseStep, remainingBeats)
        pulseIndex += 1
      }
      while (nextNoteTimeRef.current < context.currentTime + SCHEDULE_AHEAD_SECONDS) {
        const visualDelay = Math.max(0, (nextNoteTimeRef.current - context.currentTime) * 1000)
        const beat = nextBeatRef.current
        const timer = window.setTimeout(() => setCurrentBeat(beat), visualDelay)
        visualTimersRef.current.push(timer)
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
  }, [backgroundAudioAvailable, beatsPerBar, bpm, playing, prepareAudio, rhythmId, soundId])

  return { currentBeat, prepareAudio, playCompletionAlarm, scheduleTimerAlarm, cancelTimerAlarm, backgroundAudioAvailable }
}
