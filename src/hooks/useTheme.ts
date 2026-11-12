"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  isThemePreference,
  resolveTheme,
  SYSTEM_DARK_QUERY,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme";

/** Everyone who wants to know when the theme changes. */
const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(saved) ? saved : "system";
  } catch {
    return "system"; // storage blocked (e.g. some private modes)
  }
}

/** Writes the resolved theme onto <html data-theme="...">. */
export function applyTheme(preference: ThemePreference = readPreference()): void {
  const systemDark = window.matchMedia(SYSTEM_DARK_QUERY).matches;
  document.documentElement.setAttribute(
    "data-theme",
    resolveTheme(preference, systemDark),
  );
}

/** Tells React when to re-read the preference. */
function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);

  // The computer switched between light and dark (matters for "system").
  const media = window.matchMedia(SYSTEM_DARK_QUERY);
  const onSystemChange = () => {
    applyTheme();
    onChange();
  };
  // The theme was changed in ANOTHER tab of Taskly: follow it here too.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    applyTheme();
    onChange();
  };

  media.addEventListener("change", onSystemChange);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    media.removeEventListener("change", onSystemChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Read and change the theme from any component. */
export function useTheme() {
  const preference = useSyncExternalStore(
    subscribe,
    readPreference,
    // On the server we can't know the user's choice yet.
    () => "system" as const,
  );

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Can't remember it, but still switch for this visit.
    }
    applyTheme(next);
    listeners.forEach((listener) => listener());
  }, []);

  return { preference, setPreference };
}
