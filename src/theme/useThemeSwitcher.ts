import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { UnistylesRuntime, useUnistyles } from 'react-native-unistyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeName } from './colors';
import { themeNames } from './colors';

const THEME_STORAGE_KEY = 'hibi-toru.theme.v1';

const listeners = new Set<() => void>();
let currentName: ThemeName = (UnistylesRuntime.themeName ?? 'paper') as ThemeName;
let hydrated = false;

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify(name: ThemeName) {
  currentName = name;
  for (const cb of listeners) cb();
}

function isThemeName(value: string | null): value is ThemeName {
  return value !== null && (themeNames as ReadonlyArray<string>).includes(value);
}

async function hydrateOnce() {
  if (hydrated) return;
  hydrated = true;
  const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
  if (isThemeName(stored) && stored !== currentName) {
    UnistylesRuntime.setTheme(stored);
    notify(stored);
  }
}

/**
 * Applies the persisted theme before any UI renders, so cold-start doesn't
 * flash the default `paper` theme when the user picked something else.
 */
export function hydrateTheme(): Promise<void> {
  return hydrateOnce();
}

export function useThemeSwitcher() {
  useUnistyles();

  const name = useSyncExternalStore(
    subscribe,
    () => currentName,
    () => currentName,
  );

  useEffect(() => {
    hydrateOnce().catch((err) => {
      console.warn('Failed to hydrate theme', err);
    });
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    UnistylesRuntime.setTheme(next);
    notify(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch((err) => {
      console.warn('Failed to persist theme', err);
    });
  }, []);

  return { theme: name, setTheme, available: themeNames };
}
