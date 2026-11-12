import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

interface BadgeProps {
  children: ReactNode;
  /** A ready-made colour… */
  tone?: Tone;
  /** …or any colour (e.g. a label's "#3f6212"). Wins over `tone`. */
  color?: string;
  icon?: ReactNode;
  className?: string;
}

const tones: Record<Tone, string> = {
  neutral: "border-border bg-surface-muted text-muted",
  primary: "border-primary/25 bg-primary/10 text-primary",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/10 text-danger",
};

/** A small rounded tag, e.g. for priorities and labels. */
export function Badge({ children, tone = "neutral", color, icon, className }: BadgeProps) {
  return (
    <span
      // A custom colour is handed to CSS (.badge-custom in globals.css), which
      // tints the background and keeps the text readable in dark mode too.
      style={color ? ({ "--badge-color": color } as CSSProperties) : undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-4 font-semibold whitespace-nowrap",
        color ? "badge-custom" : tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
