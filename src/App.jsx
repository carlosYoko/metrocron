import { useEffect, useRef, useState } from 'react'
import { MetronomePanel } from './components/MetronomePanel.jsx'
import { TimerPanel } from './components/TimerPanel.jsx'
import { ThemeSwitcher } from './components/ThemeSwitcher.jsx'
import { useDocumentTitle } from './hooks/useDocumentTitle.js'
import { useMetronome } from './hooks/useMetronome.js'
import { usePracticeSettings } from './hooks/usePracticeSettings.js'
import { useTheme } from './hooks/useTheme.js'
import { useTimer } from './hooks/useTimer.js'

export default function App() {
  const { settings, setDuration, setBpm, setBeatsPerBar, setSoundId, setVolume, setAccentFirstBeat, setTimerMetronomeEnabled } = usePracticeSettings()
  const timer = useTimer(settings.duration, setDuration)
  const theme = useTheme()
  useDocumentTitle(timer)
  const { bpm, beatsPerBar, soundId, volume, accentFirstBeat, timerMetronomeEnabled } = settings
  const [standalonePlaying, setStandalonePlaying] = useState(false)
  const metronomePlaying = (timer.isRunning && timerMetronomeEnabled) || standalonePlaying
  const { currentBeat, prepareAudio, playCompletionAlarm } = useMetronome({ playing: metronomePlaying, bpm, beatsPerBar, soundId, volume, accentFirstBeat })
  const completionNotifiedRef = useRef(false)

  useEffect(() => {
    if (timer.status === 'finished' && !completionNotifiedRef.current) {
      completionNotifiedRef.current = true
      playCompletionAlarm()
    } else if (timer.status !== 'finished') {
      completionNotifiedRef.current = false
    }
  }, [playCompletionAlarm, timer.status])

  const toggleTimer = () => {
    prepareAudio()
    setStandalonePlaying(false)
    if (timer.isRunning) timer.pause()
    else timer.start()
  }

  const resetTimer = () => {
    setStandalonePlaying(false)
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
          <ThemeSwitcher preference={theme.preference} onChange={theme.setPreference} />
        </div>
      </header>

      <main id="top" className="workspace">
        <div className="panels-grid">
          <TimerPanel
            timer={timer}
            metronomeEnabled={timerMetronomeEnabled}
            onMetronomeToggle={toggleTimerMetronome}
            onToggle={toggleTimer}
            onReset={resetTimer}
          />
          <MetronomePanel
            bpm={bpm}
            setBpm={setBpm}
            beatsPerBar={beatsPerBar}
            setBeatsPerBar={setBeatsPerBar}
            soundId={soundId}
            setSoundId={setSoundId}
            volume={volume}
            setVolume={setVolume}
            accentFirstBeat={accentFirstBeat}
            setAccentFirstBeat={setAccentFirstBeat}
            playing={metronomePlaying}
            synced={timer.isRunning && timerMetronomeEnabled}
            currentBeat={currentBeat}
            onToggle={toggleMetronome}
          />
        </div>
      </main>

      <footer>HECHO PARA TOCAR · SIN DISTRACCIONES</footer>
    </div>
  )
}
