import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ComponentProps<"button"> {
  /** How it looks. "primary" is the main action on a screen. */
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and blocks clicks while something is happening. */
  loading?: boolean;
  /** An icon shown before the text. */
  icon?: ReactNode;
}

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap " +
  "transition-all duration-200 select-none active:scale-[0.97] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-gradient text-on-gradient shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:brightness-110",
  secondary:
    "border border-border bg-surface text-foreground shadow-sm hover:border-accent/60 hover:bg-surface-muted",
  ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
  danger: "bg-danger text-white shadow-md shadow-danger/20 hover:brightness-110",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

/** The one button used everywhere in Taskly. */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  type = "button",
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      // "button" by default, so a button inside a form never submits it by accident.
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading ? <Spinner size="sm" label="Working" /> : icon}
      {children}
    </button>
  );
}
