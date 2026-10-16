import { useCallback, useEffect, useState } from 'react';

export interface AppPreferences {
  darkMode: boolean;
  lowDataMode: boolean;
}

type PreferenceKey = keyof AppPreferences;

const STORAGE_KEY = 'stbb_app_preferences_v1';
const CHANGE_EVENT = 'stbb:preferences-change';

const DEFAULT_PREFERENCES: AppPreferences = {
  darkMode: false,
  lowDataMode: false,
};

export function getAppPreferences(): AppPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_PREFERENCES;

    const value = parsed as Partial<AppPreferences>;
    return {
      darkMode: value.darkMode === true,
      lowDataMode: value.lowDataMode === true,
    };
  } catch {
    // Storage may be unavailable in private browsing or restricted contexts.
    return DEFAULT_PREFERENCES;
  }
}

export function applyAppPreferences(preferences: AppPreferences): void {
  if (typeof document === 'undefined') return;

  document.documentElement.dataset.theme = preferences.darkMode ? 'dark' : 'light';
  document.documentElement.dataset.lowData = preferences.lowDataMode ? 'true' : 'false';
}

export function saveAppPreferences(preferences: AppPreferences): void {
  applyAppPreferences(preferences);

  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: preferences }));
    }
  } catch {
    // The current tab still updates even if persistent storage is unavailable.
  }
}

export function useAppPreferences(): {
  preferences: AppPreferences;
  setPreference: <K extends PreferenceKey>(key: K, value: AppPreferences[K]) => void;
} {
  const [preferences, setPreferences] = useState<AppPreferences>(getAppPreferences);

  useEffect(() => {
    const syncPreferences = (event: Event) => {
      const detail = (event as CustomEvent<AppPreferences>).detail;
      const next = detail || getAppPreferences();
      applyAppPreferences(next);
      setPreferences(next);
    };

    applyAppPreferences(preferences);
    window.addEventListener(CHANGE_EVENT, syncPreferences);
    window.addEventListener('storage', syncPreferences);

    return () => {
      window.removeEventListener(CHANGE_EVENT, syncPreferences);
      window.removeEventListener('storage', syncPreferences);
    };
  }, []);

  const setPreference = useCallback(<K extends PreferenceKey>(key: K, value: AppPreferences[K]) => {
    const next = { ...getAppPreferences(), [key]: value };
    saveAppPreferences(next);
  }, []);

  return { preferences, setPreference };
}
