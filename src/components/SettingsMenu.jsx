import { useEffect, useRef, useState } from 'react'
import { APP_VERSION, refreshApplication } from '../config/app.js'
import { SOUND_PRESETS } from '../config/metronome.js'
import { ThemeSwitcher } from './ThemeSwitcher.jsx'

export function SettingsMenu({ themePreference, onThemeChange, soundId, onSoundChange, audioEngine, playing }) {
  const [open, setOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')

  const refresh = async () => {
    setUpdating(true)
    setUpdateError('')
    try {
      await refreshApplication()
    } catch {
      setUpdateError('No se pudo actualizar. Comprueba tu conexión y vuelve a intentarlo.')
      setUpdating(false)
    }
  }
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    panelRef.current?.querySelector('button')?.focus()

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="settings-menu" ref={containerRef} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
    }}>
      <button
        ref={triggerRef}
        type="button"
        className={`settings-trigger ${open ? 'selected' : ''}`}
        aria-label="Configuración"
        title="Configuración"
        aria-expanded={open}
        aria-controls="settings-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
          <path d="m9 3-.5 2.3-1.8 1L4.5 6 2.8 9l1.7 1.6v2.8L2.8 15l1.7 3 2.2-.6 1.8 1L9 21h6l.5-2.6 1.8-1 2.2.6 1.7-3-1.7-1.6v-2.8L21.2 9l-1.7-3-2.2.3-1.8-1L15 3Z" />
          <circle cx="12" cy="12" r="3.2" />
        </svg>
      </button>
      {open && (
        <div className="settings-popover" id="settings-panel" role="region" aria-labelledby="settings-title" ref={panelRef}>
          <h2 id="settings-title">Configuración</h2>
          <div className="settings-section">
            <span className="setting-label">TEMA</span>
            <ThemeSwitcher preference={themePreference} onChange={onThemeChange} />
          </div>
          <div className="settings-section">
            <span className="setting-label" id="sound-label">SONIDO DEL PULSO</span>
            <div className="sound-options" role="group" aria-labelledby="sound-label">
              {SOUND_PRESETS.map((sound) => (
                <button key={sound.id} type="button" className={soundId === sound.id ? 'selected' : ''} aria-pressed={soundId === sound.id} onClick={() => onSoundChange(sound.id)}>
                  <span className={`sound-mark sound-${sound.id}`} aria-hidden="true" />
                  {sound.label}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-section app-diagnostics">
            <span className="setting-label">APLICACIÓN · {APP_VERSION}</span>
            <p>Motor: {audioEngine}</p>
            <button type="button" className="refresh-app-button" disabled={updating || playing} onClick={refresh}>
              {updating ? 'Actualizando…' : 'Renovar archivos de la aplicación'}
            </button>
            <p>{playing ? 'Detén la reproducción antes de actualizar.' : 'Requiere conexión. Conserva tus ajustes y recarga la aplicación.'}</p>
            {updateError && <p role="alert">{updateError}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
