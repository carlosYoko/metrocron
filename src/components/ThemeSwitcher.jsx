import { MoonIcon, SunIcon, SystemIcon } from './Icons.jsx'

const THEME_OPTIONS = [
  { id: 'light', label: 'Claro', Icon: SunIcon },
  { id: 'dark', label: 'Oscuro', Icon: MoonIcon },
  { id: 'system', label: 'Sistema', Icon: SystemIcon },
]

export function ThemeSwitcher({ preference, onChange }) {
  return (
    <div className="theme-switcher" role="group" aria-label="Tema de color">
      {THEME_OPTIONS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={preference === id ? 'selected' : ''}
          type="button"
          aria-pressed={preference === id}
          aria-label={`Tema ${label.toLowerCase()}`}
          title={`Tema ${label.toLowerCase()}`}
          onClick={() => onChange(id)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
