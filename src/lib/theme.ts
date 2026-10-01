// RECIAM themes (BRAND.md §9 Settings): Dark (default) · Paper · System

export type ThemeChoice = 'dark' | 'light' | 'system'

export const THEME_STORAGE_KEY = 'paramtune-theme'

export function resolveTheme(choice: ThemeChoice): 'dark' | 'light' {
  if (choice !== 'system') return choice
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

export function readThemeChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'dark' || stored === 'light' || stored === 'system') {
      return stored
    }
  } catch {
    // Storage blocked: fall back to the default
  }
  return 'dark'
}

const CHANGE_EVENT = 'paramtune-theme-change'

export function applyThemeChoice(choice: ThemeChoice) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, choice)
  } catch {
    // Storage blocked: the choice lasts for this page only
  }
  document.documentElement.dataset.theme = resolveTheme(choice)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

// useSyncExternalStore subscription: every switcher on the page stays in sync
export function subscribeThemeChoice(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

// Runs in <head> before paint so Paper users never see a dark flash
export const THEME_INIT_SCRIPT = `(function(){try{var c=localStorage.getItem('${THEME_STORAGE_KEY}');if(c==='system'){c=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}if(c==='light'||c==='dark'){document.documentElement.dataset.theme=c}}catch(e){}})()`
