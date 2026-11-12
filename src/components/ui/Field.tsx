import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** The shared look of every typing box (input, textarea, select). */
export const fieldControlClass = cn(
  "w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground shadow-sm",
  "placeholder:text-muted/70 transition-colors duration-200",
  "hover:border-accent/60",
  "focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

export interface FieldTextProps {
  /** The text above the box, e.g. "Email". */
  label?: string;
  /** A small tip under the box. Hidden while there is an error. */
  hint?: string;
  /** An error message under the box. Also turns the border red. */
  error?: string | null;
}

/**
 * Ids that connect the label, hint and error to the box, so screen readers
 * read them out when the box is focused.
 */
export function fieldIds(id: string, { hint, error }: FieldTextProps) {
  return {
    errorId: `${id}-error`,
    hintId: `${id}-hint`,
    describedBy: error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  };
}

interface FieldProps extends FieldTextProps {
  id: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/** Puts a label above a box and a hint or error below it. */
export function Field({ id, label, hint, error, required, children, className }: FieldProps) {
  const { errorId, hintId } = fieldIds(id, { hint, error });

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={errorId} className="animate-fade-up text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
