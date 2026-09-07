import { useCallback, useEffect, useRef, useState } from 'react'
import { SOUND_PRESETS } from '../config/metronome.js'

const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_SECONDS = 0.1

export function useMetronome({ playing, bpm, beatsPerBar, soundId, volume }) {
  const audioContextRef = useRef(null)
  const masterGainRef = useRef(null)
  const volumeRef = useRef(volume)
  const nextNoteTimeRef = useRef(0)
  const nextBeatRef = useRef(0)
  const visualTimersRef = useRef([])
  const [currentBeat, setCurrentBeat] = useState(-1)

  const prepareAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      audioContextRef.current = new AudioContext()
      masterGainRef.current = audioContextRef.current.createGain()
      masterGainRef.current.gain.value = volumeRef.current / 100
      masterGainRef.current.connect(audioContextRef.current.destination)
    }
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume()
    return audioContextRef.current
  }, [])

  useEffect(() => {
    volumeRef.current = volume
    const context = audioContextRef.current
    if (context && masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume / 100, context.currentTime, 0.015)
    }
  }, [volume])

  const playCompletionAlarm = useCallback(() => {
    const context = prepareAudio()
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
      const isAccent = beat === 0
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
      while (nextNoteTimeRef.current < context.currentTime + SCHEDULE_AHEAD_SECONDS) {
        schedulePulse(nextBeatRef.current, nextNoteTimeRef.current)
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
  }, [beatsPerBar, bpm, playing, prepareAudio, soundId])

  return { currentBeat, prepareAudio, playCompletionAlarm }
}
