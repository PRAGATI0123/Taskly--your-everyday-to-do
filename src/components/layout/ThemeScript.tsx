"use client";

import { themeInitScript } from "@/lib/theme";

/**
 * Puts the theme script into the page <head> (see lib/theme.ts).
 *
 * Trick from the Next.js guide "Preventing flash before hydration":
 * on the server the script is real JavaScript, so the browser runs it while
 * reading the page. In the browser React renders it as plain text, so it
 * never runs twice and React doesn't warn about a <script> tag.
 */
export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeInitScript }}
    />
  );
}
