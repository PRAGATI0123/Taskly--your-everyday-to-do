"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** Red text, for things like "Delete". */
  danger?: boolean;
  disabled?: boolean;
  /** Small grey text explaining why it's disabled, e.g. "Already first". */
  hint?: string;
}

interface MenuProps {
  /** What the button does, read by screen readers (e.g. "List actions"). */
  label: string;
  /** What the button shows, usually an icon like ⋯ */
  trigger: ReactNode;
  items: MenuItem[];
  className?: string;
}

/**
 * A small drop-down menu, like Trello's "⋯" list menu.
 * Keyboard: ↑ ↓ move between items, Enter picks, Esc closes.
 * Clicking anywhere outside also closes it.
 */
export function Menu({ label, trigger, items, className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  const enabledIndexes = items.flatMap((item, index) => (item.disabled ? [] : [index]));

  function focusItem(index: number | undefined) {
    if (index !== undefined) itemRefs.current[index]?.focus();
  }

  function close(returnFocus = true) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  // When the menu opens, put the keyboard on the first item it can use.
  useEffect(() => {
    if (open) focusItem(enabledIndexes[0]);
    // Only when it opens, not on every change of the items.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close when clicking anywhere outside the menu.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);
    const position = enabledIndexes.indexOf(current);
    const step = (by: number) =>
      enabledIndexes[(position + by + enabledIndexes.length) % enabledIndexes.length];

    if (event.key === "ArrowDown") focusItem(step(1));
    else if (event.key === "ArrowUp") focusItem(step(-1));
    else if (event.key === "Home") focusItem(enabledIndexes[0]);
    else if (event.key === "End") focusItem(enabledIndexes.at(-1));
    else if (event.key === "Escape") close();
    else if (event.key === "Tab") close(false);
    else return;
    if (event.key !== "Tab") event.preventDefault();
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "flex size-7 items-center justify-center rounded-lg text-muted transition-colors",
          "hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary",
          open && "bg-surface text-foreground",
        )}
      >
        {trigger}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          className="absolute top-full right-0 z-40 mt-1 min-w-48 animate-fade-up rounded-xl border border-border bg-surface p-1 shadow-xl shadow-primary/15 [animation-duration:150ms]"
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={item.disabled}
              onClick={() => {
                close();
                item.onSelect();
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors outline-none",
                "focus:bg-surface-muted enabled:hover:bg-surface-muted",
                "disabled:cursor-not-allowed disabled:opacity-50",
                item.danger ? "text-danger" : "text-foreground",
              )}
            >
              {item.icon && <span className="shrink-0 [&>svg]:size-4">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {item.hint && <span className="text-xs text-muted">{item.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
