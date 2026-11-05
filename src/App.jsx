import { useEffect, useRef, useState } from 'react'
import { MetronomePanel } from './components/MetronomePanel.jsx'
import { TimerPanel } from './components/TimerPanel.jsx'
import { SettingsMenu } from './components/SettingsMenu.jsx'
import { useDocumentTitle } from './hooks/useDocumentTitle.js'
import { useMetronome } from './hooks/useMetronome.js'
import { usePracticeSettings } from './hooks/usePracticeSettings.js'
import { useScreenWakeLock } from './hooks/useScreenWakeLock.js'
import { useTheme } from './hooks/useTheme.js'
import { useTimer } from './hooks/useTimer.js'

export default function App() {
  const { settings, setDuration, setBpm, setBeatsPerBar, setRhythmId, setSoundId, setVolume, setAccentFirstBeat, setTimerMetronomeEnabled, setActivePanel } = usePracticeSettings()
  const timer = useTimer(settings.duration, setDuration)
  const theme = useTheme()
  useDocumentTitle(timer)
  const { bpm, beatsPerBar, rhythmId, soundId, volume, accentFirstBeat, timerMetronomeEnabled } = settings
  const [standalonePlaying, setStandalonePlaying] = useState(false)
  const [activeMobilePanel, setActiveMobilePanel] = useState(settings.activePanel)
  const metronomePlaying = (timer.isRunning && timerMetronomeEnabled) || standalonePlaying
  const screenWakeLockStatus = useScreenWakeLock(metronomePlaying)
  const { currentBeat, prepareAudio, playCompletionAlarm, scheduleTimerAlarm, cancelTimerAlarm, backgroundAudioAvailable } = useMetronome({ playing: metronomePlaying, bpm, beatsPerBar, rhythmId, soundId, volume, accentFirstBeat })
  const completionNotifiedRef = useRef(false)

  useEffect(() => {
    if (timer.status === 'finished' && !completionNotifiedRef.current && !backgroundAudioAvailable) {
      completionNotifiedRef.current = true
      playCompletionAlarm()
    } else if (timer.status !== 'finished') {
      completionNotifiedRef.current = false
    }
  }, [backgroundAudioAvailable, playCompletionAlarm, timer.status])

  const toggleTimer = () => {
    prepareAudio()
    setStandalonePlaying(false)
    if (timer.isRunning) {
      timer.pause()
      cancelTimerAlarm()
    } else {
      const seconds = timer.remaining > 0 ? timer.remaining : timer.duration
      timer.start()
      scheduleTimerAlarm(seconds)
    }
  }

  const resetTimer = () => {
    setStandalonePlaying(false)
    cancelTimerAlarm()
    timer.reset()
  }

  const toggleMetronome = () => {
    prepareAudio()
    setStandalonePlaying((playing) => !playing)
  }

  const toggleTimerMetronome = () => {
    prepareAudio()
    setStandalonePlaying(false)
    setTimerMetronomeEnabled((isEnabled) => !isEnabled)
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Metrocron, inicio">
          <span className="brand-icon"><span /><span /><span /><span /></span>
          <span>metro<strong>cron</strong></span>
        </a>
        <div className="header-actions">
          <SettingsMenu
            themePreference={theme.preference}
            onThemeChange={theme.setPreference}
            soundId={soundId}
            onSoundChange={setSoundId}
          />
        </div>
      </header>

      <main id="top" className="workspace">
        <nav className="mobile-panel-switcher" aria-label="Seleccionar herramienta">
          <button
            type="button"
            className={activeMobilePanel === 'metronome' ? 'selected' : ''}
            aria-pressed={activeMobilePanel === 'metronome'}
            onClick={() => {
              setActiveMobilePanel('metronome')
              setActivePanel('metronome')
            }}
          >
            Metrónomo
            {metronomePlaying && <span className="mobile-tab-indicator" aria-label="En marcha" />}
          </button>
          <button
            type="button"
            className={activeMobilePanel === 'timer' ? 'selected' : ''}
            aria-pressed={activeMobilePanel === 'timer'}
            onClick={() => {
              setActiveMobilePanel('timer')
              setActivePanel('timer')
            }}
          >
            Temporizador
            {timer.isRunning && <span className="mobile-tab-indicator" aria-label="En marcha" />}
          </button>
        </nav>
        <div className="panels-grid">
          <MetronomePanel
            className={activeMobilePanel === 'metronome' ? 'mobile-panel-active' : 'mobile-panel-hidden'}
            bpm={bpm}
            setBpm={setBpm}
            beatsPerBar={beatsPerBar}
            setBeatsPerBar={setBeatsPerBar}
            rhythmId={rhythmId}
            setRhythmId={setRhythmId}
            volume={volume}
            setVolume={setVolume}
            accentFirstBeat={accentFirstBeat}
            setAccentFirstBeat={setAccentFirstBeat}
            playing={metronomePlaying}
            synced={timer.isRunning && timerMetronomeEnabled}
            currentBeat={currentBeat}
            onToggle={toggleMetronome}
            screenWakeLockStatus={screenWakeLockStatus}
          />
          <TimerPanel
            className={activeMobilePanel === 'timer' ? 'mobile-panel-active' : 'mobile-panel-hidden'}
            timer={timer}
            metronomeEnabled={timerMetronomeEnabled}
            onMetronomeToggle={toggleTimerMetronome}
            onToggle={toggleTimer}
            onReset={resetTimer}
          />
        </div>
      </main>

      <footer>HECHO PARA TOCAR · SIN DISTRACCIONES</footer>
    </div>
  )
}
