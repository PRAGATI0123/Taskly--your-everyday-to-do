"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { IconButton } from "@/components/ui";
import { applyTheme, useTheme } from "@/hooks/useTheme";
import type { ThemePreference } from "@/lib/theme";

/** Each click moves to the next choice: light → dark → system → light … */
const NEXT: Record<ThemePreference, ThemePreference> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const ICONS: Record<ThemePreference, ReactNode> = {
  light: <Sun className="size-[18px]" />,
  dark: <Moon className="size-[18px]" />,
  system: <Monitor className="size-[18px]" />,
};

const NAMES: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

/** The sun / moon / monitor button in the header. */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  // In development React re-mounts the page once and wipes the attribute the
  // head script put on <html>. Put it back before the screen is painted.
  // (In a production build this changes nothing.)
  useLayoutEffect(() => {
    applyTheme();
  }, []);

  const next = NEXT[preference];

  return (
    <IconButton
      icon={ICONS[preference]}
      label={`Theme: ${NAMES[preference]}. Switch to ${NAMES[next]}.`}
      onClick={() => setPreference(next)}
    />
  );
}
