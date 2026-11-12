/**
 * Light / dark mode — the parts that don't need React.
 *
 * The user picks a PREFERENCE:  "light" | "dark" | "system" (follow the computer).
 * We turn it into the RESOLVED theme actually shown: "light" | "dark".
 * The resolved theme is written on <html data-theme="..."> and the CSS does the rest.
 */

/** Where the choice is remembered (localStorage, see below for why). */
export const THEME_STORAGE_KEY = "taskly-theme";

export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = "light" | "dark";

export const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

export function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference);
}

/** "system" follows the computer's setting; the others are used as they are. */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === "system") return systemPrefersDark ? "dark" : "light";
  return preference;
}

/**
 * A tiny script that runs in the page <head> BEFORE anything is drawn, so a
 * dark-mode user never sees a white flash. It must be plain old JavaScript
 * in a string, because it runs before React (or any of our code) has loaded.
 *
 * Why localStorage and not IndexedDB here? localStorage can be read instantly
 * (synchronously); IndexedDB always answers later, which would be too late.
 */
export const themeInitScript = `(function(){try{var p=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var d=p==="dark"||(p!=="light"&&window.matchMedia(${JSON.stringify(
  SYSTEM_DARK_QUERY,
)}).matches);document.documentElement.setAttribute("data-theme",d?"dark":"light")}catch(e){}})()`;
