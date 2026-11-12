import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface IconButtonProps extends Omit<ComponentProps<"button">, "children"> {
  /** The icon to show. */
  icon: ReactNode;
  /**
   * Required: what the button does, in words (e.g. "Delete task").
   * An icon alone can't be read by screen readers, so this becomes its name
   * and also shows as a tooltip on hover.
   */
  label: string;
  variant?: "ghost" | "secondary" | "danger";
  size?: "sm" | "md";
}

const variants = {
  ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
  secondary: "border border-border bg-surface text-foreground shadow-sm hover:bg-surface-muted",
  danger: "text-muted hover:bg-danger/10 hover:text-danger",
};

const sizes = { sm: "size-8", md: "size-10" };

/** A small square button that shows only an icon. */
export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  type = "button",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl transition-all duration-200 active:scale-95",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
