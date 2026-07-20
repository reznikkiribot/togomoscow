export type ThemePreference = 'auto' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'togomoscow_theme';

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === 'light' || value === 'dark') return value;
  } catch {
    /* localStorage may be unavailable in a locked-down WebView */
  }
  return 'auto';
}

function automaticTheme(): 'light' | 'dark' {
  const telegramScheme = window.Telegram?.WebApp?.colorScheme;
  if (telegramScheme === 'light' || telegramScheme === 'dark') return telegramScheme;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyThemePreference(preference = readThemePreference()): 'light' | 'dark' {
  const resolved = preference === 'auto' ? automaticTheme() : preference;
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolved;
  return resolved;
}

export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === 'auto') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* apply in-memory even if persistence is unavailable */
  }
  applyThemePreference(preference);
  window.dispatchEvent(new CustomEvent('togomoscow-theme-change'));
}

// Apply before React mounts so navigation between app screens never flashes.
applyThemePreference();
