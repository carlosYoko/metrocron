import { useState } from 'react'
import { MetronomePanel } from './components/MetronomePanel.jsx'
import { TimerPanel } from './components/TimerPanel.jsx'
import { useMetronome } from './hooks/useMetronome.js'
import { useTimer } from './hooks/useTimer.js'

export default function App() {
  const timer = useTimer()
  const [bpm, setBpm] = useState(84)
  const [beatsPerBar, setBeatsPerBar] = useState(4)
  const [soundId, setSoundId] = useState('classic')
  const [standalonePlaying, setStandalonePlaying] = useState(false)
  const metronomePlaying = timer.isRunning || standalonePlaying
  const { currentBeat, prepareAudio } = useMetronome({ playing: metronomePlaying, bpm, beatsPerBar, soundId })

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

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Metrocron, inicio">
          <span className="brand-icon"><span /><span /><span /><span /></span>
          <span>metro<strong>cron</strong></span>
        </a>
        <p>Tu tiempo, a tempo.</p>
      </header>

      <main id="top" className="workspace">
        <div className="intro">
          <span className="intro-line" />
          <p>Afina tu enfoque. Marca tu ritmo.</p>
          <span className="intro-line" />
        </div>
        <div className="panels-grid">
          <TimerPanel timer={timer} onToggle={toggleTimer} onReset={resetTimer} />
          <MetronomePanel
            bpm={bpm}
            setBpm={setBpm}
            beatsPerBar={beatsPerBar}
            setBeatsPerBar={setBeatsPerBar}
            soundId={soundId}
            setSoundId={setSoundId}
            playing={metronomePlaying}
            synced={timer.isRunning}
            currentBeat={currentBeat}
            onToggle={toggleMetronome}
          />
        </div>
      </main>

      <footer>HECHO PARA TOCAR · SIN DISTRACCIONES</footer>
    </div>
  )
}
