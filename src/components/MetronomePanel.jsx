import { useEffect, useRef, useState } from 'react'
import { BPM_MAX, BPM_MIN, SOUND_PRESETS, TIME_SIGNATURES } from '../config/metronome.js'
import { MinusIcon, PauseIcon, PlayIcon, PlusIcon, VolumeIcon, VolumeMutedIcon } from './Icons.jsx'

export function MetronomePanel({ bpm, setBpm, beatsPerBar, setBeatsPerBar, soundId, setSoundId, volume, setVolume, playing, synced, currentBeat, onToggle }) {
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
    <section className="panel metronome-panel" aria-labelledby="metronome-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">RITMO</span>
          <h2 id="metronome-title">Metrónomo</h2>
        </div>
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

      <div className="tempo-control">
        <button className="round-button" onClick={() => changeBpm(-1)} aria-label="Bajar un BPM"><MinusIcon /></button>
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
        <button className="round-button" onClick={() => changeBpm(1)} aria-label="Subir un BPM"><PlusIcon /></button>
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

      <div className="setting-group">
        <span className="setting-label">COMPÁS</span>
        <div className="segmented-control">
          {TIME_SIGNATURES.map((beats) => (
            <button key={beats} className={beatsPerBar === beats ? 'selected' : ''} onClick={() => setBeatsPerBar(beats)}>{beats}/4</button>
          ))}
        </div>
      </div>

      <div className="setting-group sound-group">
        <span className="setting-label">SONIDO DEL PULSO</span>
        <div className="sound-options">
          {SOUND_PRESETS.map((sound) => (
            <button key={sound.id} className={soundId === sound.id ? 'selected' : ''} onClick={() => setSoundId(sound.id)}>
              <span className={`sound-mark sound-${sound.id}`} />{sound.label}
            </button>
          ))}
        </div>
      </div>

      <button className={`metronome-action ${playing ? 'active' : ''}`} onClick={onToggle} disabled={synced}>
        {playing ? <PauseIcon /> : <PlayIcon />}
        {synced ? 'Sincronizado con la sesión' : playing ? 'Detener metrónomo' : 'Usar sin temporizador'}
      </button>
    </section>
  )
}
