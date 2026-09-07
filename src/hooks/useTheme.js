import { useEffect, useState } from 'react'

const STORAGE_KEY = 'metrocron-theme'
const VALID_PREFERENCES = ['light', 'dark', 'system']

const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export function useTheme() {
  const [preference, setPreference] = useState(() => {
    const savedPreference = localStorage.getItem(STORAGE_KEY)
    return VALID_PREFERENCES.includes(savedPreference) ? savedPreference : 'system'
  })
  const [systemTheme, setSystemTheme] = useState(getSystemTheme)
  const resolvedTheme = preference === 'system' ? systemTheme : preference

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event) => setSystemTheme(event.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
    localStorage.setItem(STORAGE_KEY, preference)
  }, [preference, resolvedTheme])

  return { preference, resolvedTheme, setPreference }
}
