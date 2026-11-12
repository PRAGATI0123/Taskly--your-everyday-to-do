"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

interface ModalProps {
  /** Is the window showing? The parent decides. */
  open: boolean;
  /** Called when the user wants to close it (X button, Esc key, or clicking outside). */
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Buttons along the bottom, e.g. Cancel / Save. */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Bare mode: no ready-made header or padding — the children draw the whole
   * window (used by the task pop-up, which has its own editable title).
   * `title` is still used as the window's name for screen readers.
   */
  bare?: boolean;
}

const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

/**
 * A pop-up window built on the browser's own <dialog> element, which gives us
 * for free: a dark backdrop, the Esc key, keeping keyboard focus inside the
 * window, and putting focus back where it was after closing.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  bare = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Keep the real <dialog> in sync with the `open` prop.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Put the keyboard focus on the element marked `data-autofocus`
      // (React's own autoFocus runs too early, before the dialog is shown).
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();

    // Clean-up: runs when the modal is removed OR hidden. (Next.js keeps the
    // previous page hidden for instant Back/Forward; a hidden modal must not
    // stay "open". When the page is shown again, this effect re-opens it.)
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={bare ? undefined : titleId}
      aria-label={bare ? title : undefined}
      aria-describedby={description && !bare ? descriptionId : undefined}
      // Esc: don't let the browser close it by itself — ask the parent,
      // so the parent's `open` state stays the single source of truth.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // A click on the dialog itself (not its contents) = a click on the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl shadow-primary/10",
        "backdrop:bg-foreground/40 backdrop:backdrop-blur-sm",
        "open:animate-fade-up",
        widths[size],
      )}
    >
      {/* Only build the contents while open, so forms start fresh every time. */}
      {open && bare && <div className="max-h-[88vh] overflow-y-auto">{children}</div>}
      {open && !bare && (
        <div className="flex max-h-[85vh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-border px-6 pt-5 pb-4">
            <div>
              <h2 id={titleId} className="font-display text-xl font-semibold">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-muted">
                  {description}
                </p>
              )}
            </div>
            <IconButton
              icon={<X className="size-4" />}
              label="Close"
              size="sm"
              onClick={onClose}
            />
          </header>

          <div className="overflow-y-auto px-6 py-5">{children}</div>

          {footer && (
            <footer className="flex justify-end gap-2 border-t border-border bg-surface-muted/50 px-6 py-4">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
