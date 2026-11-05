import { useCallback, useEffect, useState } from 'react'
import { BPM_MAX, BPM_MIN, RHYTHMS, SOUND_PRESETS, TIME_SIGNATURES } from '../config/metronome.js'

const STORAGE_KEY = 'metrocron-practice-settings'
const MAX_DURATION = 99 * 60 + 59
const DEFAULT_SETTINGS = {
  duration: 3 * 60,
  bpm: 84,
  beatsPerBar: 4,
  soundId: 'classic',
  rhythmId: 'quarter',
  volume: 100,
  accentFirstBeat: true,
  timerMetronomeEnabled: true,
  activePanel: 'metronome',
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const rhythmIds = new Set(RHYTHMS.map(({ id }) => id))
const soundIds = new Set(SOUND_PRESETS.map(({ id }) => id))

const sanitizeSetting = (key, value) => {
  if (key === 'duration') return clamp(Math.round(Number(value) || 0), 0, MAX_DURATION)
  if (key === 'bpm') return clamp(Math.round(Number(value) || BPM_MIN), BPM_MIN, BPM_MAX)
  if (key === 'beatsPerBar') return TIME_SIGNATURES.includes(Number(value)) ? Number(value) : DEFAULT_SETTINGS.beatsPerBar
  if (key === 'rhythmId') return rhythmIds.has(value) ? value : DEFAULT_SETTINGS.rhythmId
  if (key === 'soundId') return soundIds.has(value) ? value : DEFAULT_SETTINGS.soundId
  if (key === 'volume') return clamp(Math.round(Number(value) || 0), 0, 100)
  if (key === 'accentFirstBeat') return typeof value === 'boolean' ? value : DEFAULT_SETTINGS.accentFirstBeat
  if (key === 'timerMetronomeEnabled') return typeof value === 'boolean' ? value : DEFAULT_SETTINGS.timerMetronomeEnabled
  if (key === 'activePanel') return ['timer', 'metronome'].includes(value) ? value : DEFAULT_SETTINGS.activePanel
  return value
}

const loadSettings = () => {
  try {
    const savedSettings = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!savedSettings || typeof savedSettings !== 'object') return DEFAULT_SETTINGS

    return Object.fromEntries(
      Object.entries(DEFAULT_SETTINGS).map(([key, fallback]) => [
        key,
        sanitizeSetting(key, savedSettings[key] ?? fallback),
      ]),
    )
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function usePracticeSettings() {
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const updateSetting = useCallback((key, valueOrUpdater) => {
    setSettings((currentSettings) => {
      const currentValue = currentSettings[key]
      const nextValue = typeof valueOrUpdater === 'function' ? valueOrUpdater(currentValue) : valueOrUpdater
      return { ...currentSettings, [key]: sanitizeSetting(key, nextValue) }
    })
  }, [])

  const setDuration = useCallback((value) => updateSetting('duration', value), [updateSetting])
  const setBpm = useCallback((value) => updateSetting('bpm', value), [updateSetting])
  const setBeatsPerBar = useCallback((value) => updateSetting('beatsPerBar', value), [updateSetting])
  const setRhythmId = useCallback((value) => updateSetting('rhythmId', value), [updateSetting])
  const setSoundId = useCallback((value) => updateSetting('soundId', value), [updateSetting])
  const setVolume = useCallback((value) => updateSetting('volume', value), [updateSetting])
  const setAccentFirstBeat = useCallback((value) => updateSetting('accentFirstBeat', value), [updateSetting])
  const setTimerMetronomeEnabled = useCallback((value) => updateSetting('timerMetronomeEnabled', value), [updateSetting])
  const setActivePanel = useCallback((value) => updateSetting('activePanel', value), [updateSetting])

  return { settings, setDuration, setBpm, setBeatsPerBar, setRhythmId, setSoundId, setVolume, setAccentFirstBeat, setTimerMetronomeEnabled, setActivePanel }
}
