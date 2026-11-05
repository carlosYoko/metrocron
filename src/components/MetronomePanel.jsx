import { useEffect, useRef, useState } from 'react'
import { BPM_MAX, BPM_MIN, RHYTHMS, TIME_SIGNATURES } from '../config/metronome.js'
import { PauseIcon, PlayIcon, VolumeIcon, VolumeMutedIcon } from './Icons.jsx'
import { RhythmIcon } from './RhythmIcon.jsx'

export function MetronomePanel({ className = '', bpm, setBpm, beatsPerBar, setBeatsPerBar, rhythmId, setRhythmId, volume, setVolume, accentFirstBeat, setAccentFirstBeat, playing, synced, currentBeat, onToggle, screenWakeLockStatus }) {
  const [isVolumeOpen, setIsVolumeOpen] = useState(false)
  const volumeControlRef = useRef(null)
  const volumeButtonRef = useRef(null)
  const changeBpm = (difference) => setBpm((current) => Math.min(BPM_MAX, Math.max(BPM_MIN, current + difference)))

  useEffect(() => {
    if (!isVolumeOpen) return undefined

    const handlePointerDown = (event) => {
      if (!volumeControlRef.current?.contains(event.target)) setIsVolumeOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsVolumeOpen(false)
        volumeButtonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVolumeOpen])

  return (
    <section className={`panel metronome-panel ${className}`} aria-labelledby="metronome-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">RITMO</span>
          <h2 id="metronome-title">Metrónomo</h2>
        </div>
        <div className="metronome-header-controls">
          <button
            className={`accent-button ${accentFirstBeat ? 'selected' : ''}`}
            type="button"
            aria-pressed={accentFirstBeat}
            aria-label="Acentuar el primer pulso del compás"
            title={accentFirstBeat ? 'Acento del primer pulso activado' : 'Acento del primer pulso desactivado'}
            onClick={() => setAccentFirstBeat((isEnabled) => !isEnabled)}
          >
            Acento
          </button>
        <div className={`volume-control ${isVolumeOpen ? 'is-open' : ''}`} ref={volumeControlRef}>
          <button
            ref={volumeButtonRef}
            className="volume-trigger"
            type="button"
            aria-label={`Ajustar volumen, ${volume}%`}
            aria-expanded={isVolumeOpen}
            aria-controls="volume-popover"
            title="Ajustar volumen"
            onClick={() => setIsVolumeOpen((isOpen) => !isOpen)}
          >
            {volume === 0 ? <VolumeMutedIcon /> : <VolumeIcon />}
          </button>
          {isVolumeOpen && <div className="volume-popover" id="volume-popover">
            <div className="volume-heading">
              <span>VOLUMEN</span>
              <strong>{volume}%</strong>
            </div>
            <input
              aria-label="Volumen del metrónomo"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              style={{ '--volume-progress': `${volume}%` }}
            />
          </div>}
        </div>
        </div>
      </div>

      <div className="tempo-control">
        <div className="tempo-step-group">
          <button className="round-button" onClick={() => changeBpm(-1)} aria-label="Bajar un BPM">-1</button>
          <button className="bpm-step-button" onClick={() => changeBpm(-5)} aria-label="Bajar 5 BPM">-5</button>
        </div>
        <div className="bpm-readout">
          <input
            aria-label="Pulsos por minuto"
            type="number"
            min={BPM_MIN}
            max={BPM_MAX}
            value={bpm}
            onChange={(event) => setBpm(Math.min(BPM_MAX, Math.max(BPM_MIN, Number(event.target.value) || BPM_MIN)))}
          />
          <span>BPM</span>
        </div>
        <div className="tempo-step-group">
          <button className="round-button" onClick={() => changeBpm(1)} aria-label="Subir un BPM">+1</button>
          <button className="bpm-step-button" onClick={() => changeBpm(5)} aria-label="Subir 5 BPM">+5</button>
        </div>
      </div>

      <input
        className="tempo-slider"
        aria-label="Velocidad del metrónomo"
        type="range"
        min={BPM_MIN}
        max={BPM_MAX}
        value={bpm}
        onChange={(event) => setBpm(Number(event.target.value))}
        style={{ '--range-progress': `${((bpm - BPM_MIN) / (BPM_MAX - BPM_MIN)) * 100}%` }}
      />
      <div className="tempo-labels"><span>Lento</span><span>Moderado</span><span>Rápido</span></div>

      <div className="beat-indicator" aria-label={`Compás de ${beatsPerBar} pulsos`}>
        {Array.from({ length: beatsPerBar }, (_, beat) => (
          <span key={beat} className={playing && currentBeat === beat ? 'active' : ''}>{beat + 1}</span>
        ))}
      </div>

      <button className={`metronome-action ${playing ? 'active' : ''}`} onClick={onToggle} disabled={synced}>
        {playing ? <PauseIcon /> : <PlayIcon />}
        {synced ? 'Sincronizado con la sesión' : playing ? 'Detener metrónomo' : 'Usar sin temporizador'}
      </button>

      <div className="setting-group">
        <span className="setting-label">COMPÁS</span>
        <div className="segmented-control">
          {TIME_SIGNATURES.map((beats) => (
            <button key={beats} className={beatsPerBar === beats ? 'selected' : ''} onClick={() => setBeatsPerBar(beats)}>{beats}/4</button>
          ))}
        </div>
      </div>

      <div className="rhythm-setting">
        <span className="setting-label" id="rhythm-label">FIGURA RÍTMICA</span>
        <div className="rhythm-options" role="group" aria-labelledby="rhythm-label">
          {RHYTHMS.map((rhythm) => {
            const duration = rhythm.divisions === 1 ? `${rhythm.beats}` : `1/${rhythm.divisions}`
            const durationLabel = `${duration} ${rhythm.beats === 1 ? 'tiempo' : 'tiempos'}`
            return (
              <button
                key={rhythm.id}
                type="button"
                className={rhythmId === rhythm.id ? 'selected' : ''}
                aria-pressed={rhythmId === rhythm.id}
                aria-label={`${rhythm.label}, ${durationLabel}`}
                onClick={() => setRhythmId(rhythm.id)}
              >
                <RhythmIcon rhythmId={rhythm.id} />
                <span className="rhythm-name">{rhythm.label}</span>
                <span className="rhythm-duration">{durationLabel}</span>
              </button>
            )
          })}
        </div>
      </div>


      {playing && screenWakeLockStatus !== 'idle' && (
        <p className={`screen-wake-lock-status screen-wake-lock-${screenWakeLockStatus}`} role="status">
          {screenWakeLockStatus === 'active'
            ? 'La pantalla no se apagará automáticamente mientras el metrónomo esté en marcha.'
            : screenWakeLockStatus === 'unsupported'
              ? 'Este navegador no permite mantener la pantalla encendida.'
              : screenWakeLockStatus === 'unavailable'
                ? 'No se pudo mantener la pantalla encendida.'
                : 'Solicitando mantener la pantalla encendida…'}
        </p>
      )}
    </section>
  )
}
