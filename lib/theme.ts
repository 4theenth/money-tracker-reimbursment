export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'money-tracker:theme'
const CHANGE_EVENT = 'money-tracker:theme-change'
const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Runs before first paint, so a saved or system dark theme never flashes light. */
export const THEME_INIT_SCRIPT = `(function(){var p=null;try{p=localStorage.getItem(${JSON.stringify(STORAGE_KEY)})}catch(e){}var t=p==="light"||p==="dark"?p:window.matchMedia(${JSON.stringify(DARK_QUERY)}).matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)})()`

// Keeps the choice for this page when browser storage is blocked
let memoryPreference: ThemePreference = 'system'

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
    if (stored === null) return memoryPreference
  } catch {
    return memoryPreference
  }
  return 'system'
}

export function applyTheme() {
  const preference = getThemePreference()
  const theme = preference === 'system'
    ? (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light')
    : preference
  document.documentElement.setAttribute('data-theme', theme)
}

export function setThemePreference(preference: ThemePreference) {
  memoryPreference = preference
  try {
    if (preference === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // The in-memory choice still applies until the page reloads
  }
  applyTheme()
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeToThemePreference(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/** Follows system and other-tab changes, and always prints on a light page. */
export function startThemeSync() {
  const media = window.matchMedia(DARK_QUERY)
  const printLight = () => document.documentElement.setAttribute('data-theme', 'light')

  media.addEventListener('change', applyTheme)
  window.addEventListener('storage', applyTheme)
  window.addEventListener('beforeprint', printLight)
  window.addEventListener('afterprint', applyTheme)

  return () => {
    media.removeEventListener('change', applyTheme)
    window.removeEventListener('storage', applyTheme)
    window.removeEventListener('beforeprint', printLight)
    window.removeEventListener('afterprint', applyTheme)
  }
}
