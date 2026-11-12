"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button, IconButton } from "@/components/ui";
import { cn } from "@/lib/cn";

interface InlineComposerProps {
  /** Text on the closed button, e.g. "Add a card". */
  openLabel: string;
  /** Text on the submit button, e.g. "Add card". */
  submitLabel: string;
  placeholder: string;
  /** Multi-line box (cards) or one-line box (lists). */
  multiline?: boolean;
  /** Return an error message, or null if it worked. */
  onSubmit: (text: string) => string | null;
  className?: string;
}

/**
 * Trello's "+ Add a card" / "+ Add another list": a button that turns into a
 * small typing box. Enter adds and keeps the box open for the next one,
 * Esc closes it.
 */
export function InlineComposer({
  openLabel,
  submitLabel,
  placeholder,
  multiline = false,
  onSubmit,
  className,
}: InlineComposerProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  function close() {
    setOpen(false);
    setText("");
    setError(null);
  }

  function submit(event?: FormEvent | KeyboardEvent) {
    event?.preventDefault();
    const problem = onSubmit(text);
    if (problem) {
      setError(problem);
      return;
    }
    setText("");
    setError(null);
    inputRef.current?.focus(); // ready for the next one
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
    // Enter adds; Shift+Enter makes a new line in the card box.
    if (event.key === "Enter" && multiline && !event.shiftKey) {
      submit(event);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors",
          "hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary",
          className,
        )}
      >
        <Plus className="size-4" aria-hidden="true" />
        {openLabel}
      </button>
    );
  }

  const fieldClass = cn(
    "w-full rounded-xl border bg-surface px-3 py-2 text-sm shadow-sm placeholder:text-muted/70",
    "focus:outline-none focus:ring-4",
    error ? "border-danger focus:ring-danger/15" : "border-accent/60 focus:ring-primary/15",
  );

  return (
    <form onSubmit={submit} className={cn("flex animate-fade-up flex-col gap-2", className)}>
      {multiline ? (
        <textarea
          ref={inputRef}
          autoFocus
          rows={2}
          aria-label={placeholder}
          aria-invalid={error ? true : undefined}
          placeholder={placeholder}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          className={cn(fieldClass, "resize-none")}
        />
      ) : (
        <input
          ref={inputRef}
          autoFocus
          aria-label={placeholder}
          aria-invalid={error ? true : undefined}
          placeholder={placeholder}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          className={cn(fieldClass, "h-10")}
        />
      )}
      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
      <div className="flex items-center gap-1">
        <Button type="submit" size="sm">
          {submitLabel}
        </Button>
        <IconButton size="sm" icon={<X className="size-4" />} label="Cancel" onClick={close} />
      </div>
    </form>
  );
}
