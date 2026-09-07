import { PauseIcon, PlayIcon, ResetIcon } from './Icons.jsx'

const pad = (value) => String(value).padStart(2, '0')

export function TimerPanel({ timer, metronomeEnabled, onMetronomeToggle, onToggle, onReset }) {
  const minutes = Math.floor(timer.remaining / 60)
  const seconds = timer.remaining % 60
  const configuredMinutes = Math.floor(timer.duration / 60)
  const configuredSeconds = timer.duration % 60
  const circumference = 2 * Math.PI * 132
  const dashOffset = circumference * (1 - timer.progress)

  const updateTime = (part, rawValue) => {
    const value = Number(rawValue)
    if (part === 'minutes') timer.setTime(value, configuredSeconds)
    else timer.setTime(configuredMinutes, value)
  }

  return (
    <section className="panel timer-panel" aria-labelledby="timer-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">SESIÓN</span>
          <h2 id="timer-title">Temporizador</h2>
        </div>
        <span className={`status-pill status-${timer.status}`}>
          <span />{timer.isRunning ? 'En práctica' : timer.status === 'paused' ? 'En pausa' : timer.status === 'finished' ? 'Completado' : 'Preparado'}
        </span>
      </div>

      <div className={`timer-clock ${timer.isRunning ? 'is-running' : ''}`}>
        <svg className="progress-ring" viewBox="0 0 288 288" aria-hidden="true">
          <circle className="ring-track" cx="144" cy="144" r="132" />
          <circle
            className="ring-value"
            cx="144"
            cy="144"
            r="132"
            style={{ strokeDasharray: circumference, strokeDashoffset: dashOffset }}
          />
        </svg>
        <div className="time-display" aria-live="polite">
          <strong>{pad(minutes)}:{pad(seconds)}</strong>
          <span>MIN &nbsp;&nbsp; SEG</span>
        </div>
      </div>

      <div className="time-inputs" aria-label="Configurar duración">
        <label>
          <span>Minutos</span>
          <input type="number" min="0" max="99" value={configuredMinutes} disabled={timer.isRunning} onChange={(event) => updateTime('minutes', event.target.value)} />
        </label>
        <span className="input-separator">:</span>
        <label>
          <span>Segundos</span>
          <input type="number" min="0" max="59" value={configuredSeconds} disabled={timer.isRunning} onChange={(event) => updateTime('seconds', event.target.value)} />
        </label>
      </div>

      <div className="timer-metronome-setting">
        <span className="setting-label">METRÓNOMO EN LA SESIÓN</span>
        <div className="accent-control">
          <span>{metronomeEnabled ? 'Sí' : 'No'}</span>
          <button
            className={`toggle-switch ${metronomeEnabled ? 'selected' : ''}`}
            type="button"
            role="switch"
            aria-checked={metronomeEnabled}
            aria-label="Usar el metrónomo con el temporizador"
            onClick={onMetronomeToggle}
          >
            <span />
          </button>
        </div>
      </div>

      <div className="timer-actions">
        <button className="primary-action" onClick={onToggle} disabled={!timer.isRunning && timer.duration === 0}>
          {timer.isRunning ? <PauseIcon /> : <PlayIcon />}
          {timer.isRunning ? 'Pausar sesión' : timer.status === 'paused' ? 'Continuar sesión' : 'Empezar sesión'}
        </button>
        <button className="icon-button" onClick={onReset} aria-label="Reiniciar temporizador" title="Reiniciar">
          <ResetIcon />
        </button>
      </div>
    </section>
  )
}
