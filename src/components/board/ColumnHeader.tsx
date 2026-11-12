"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, CircleCheck, Ellipsis, Pencil, Trash2 } from "lucide-react";
import { Menu } from "@/components/ui";
import { canDeleteColumn, COLUMN_TITLE_MAX_LENGTH } from "@/lib/board";
import { cn } from "@/lib/cn";
import type { Column, ID } from "@/lib/types";
import { useTasklyStore } from "@/store/tasklyStore";

interface ColumnHeaderProps {
  projectId: ID;
  column: Column;
  /** All the board's columns (to know the position and if it can be deleted). */
  columns: Column[];
  cardCount: number;
  /** All cards in the list, including ones hidden by filters. */
  totalCount: number;
  isDoneColumn: boolean;
  /** Owners/admins on a non-archived project. */
  canManage: boolean;
  onRequestDelete: (columnId: ID) => void;
}

/** A list's title (click to rename), card count and "⋯" menu. */
export function ColumnHeader({
  projectId,
  column,
  columns,
  cardCount,
  totalCount,
  isDoneColumn,
  canManage,
  onRequestDelete,
}: ColumnHeaderProps) {
  const renameColumn = useTasklyStore((state) => state.renameColumn);
  const moveColumn = useTasklyStore((state) => state.moveColumn);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(column.title);
  const [error, setError] = useState<string | null>(null);
  // Set when Esc is pressed, so the "blur" that follows doesn't save anyway.
  const cancelledRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // When the text box opens: focus it and select the old name, so typing
  // replaces it (like Trello).
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const index = columns.findIndex((c) => c.id === column.id);
  const isFirst = index === 0;
  const isLast = index === columns.length - 1;

  function startEditing() {
    cancelledRef.current = false;
    setDraft(column.title);
    setError(null);
    setEditing(true);
  }

  /** Close the text box (after saving or cancelling). */
  function cancel() {
    cancelledRef.current = true; // any blur from now on is ignored
    setEditing(false);
    setError(null);
  }

  /** Try to save. Returns true if it worked (or nothing changed). */
  function save(): boolean {
    if (draft.trim() === column.title) {
      cancel();
      return true;
    }
    const result = renameColumn(projectId, column.id, draft);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    cancel();
    return true;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    save();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelledRef.current = true;
      cancel();
    }
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-1 px-2 pt-2 pb-2">
        <input
          ref={inputRef}
          aria-label="List name"
          aria-invalid={error ? true : undefined}
          value={draft}
          maxLength={COLUMN_TITLE_MAX_LENGTH + 10}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          // Clicking away saves, like Trello. If the name isn't allowed, the
          // old name simply stays.
          onBlur={() => {
            if (cancelledRef.current) return;
            if (!save()) cancel();
          }}
          className={cn(
            "h-8 w-full rounded-lg border bg-surface px-2 text-sm font-semibold focus:ring-4 focus:outline-none",
            error ? "border-danger focus:ring-danger/15" : "border-accent/60 focus:ring-primary/15",
          )}
        />
        {error && (
          <p role="alert" className="px-1 text-xs font-medium text-danger">
            {error}
          </p>
        )}
      </form>
    );
  }

  return (
    <header className="flex items-center justify-between gap-1 px-3 pt-3 pb-2">
      <h2 className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
        {isDoneColumn && (
          <span title="Cards in the last list count as done" className="flex">
            <CircleCheck className="size-4 shrink-0 text-success" aria-label="Done list" />
          </span>
        )}
        {canManage ? (
          // Click the title to rename it, like Trello.
          <button
            type="button"
            onClick={startEditing}
            title="Click to rename"
            className="truncate rounded px-1 -mx-1 text-left hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary"
          >
            {column.title}
          </button>
        ) : (
          <span className="truncate">{column.title}</span>
        )}
      </h2>

      <div className="flex shrink-0 items-center gap-0.5">
        <span
          className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted tabular-nums"
          title={cardCount !== totalCount ? `${cardCount} shown of ${totalCount}` : undefined}
        >
          {/* "2/5" while filters hide some cards, otherwise just "5". */}
          {cardCount !== totalCount ? `${cardCount}/${totalCount}` : cardCount}
        </span>
        {canManage && (
          <Menu
            label={`${column.title} list actions`}
            trigger={<Ellipsis className="size-4" />}
            items={[
              { label: "Rename list", icon: <Pencil />, onSelect: startEditing },
              {
                label: "Move left",
                icon: <ArrowLeft />,
                disabled: isFirst,
                hint: isFirst ? "First" : undefined,
                onSelect: () => moveColumn(projectId, column.id, index - 1),
              },
              {
                label: "Move right",
                icon: <ArrowRight />,
                disabled: isLast,
                hint: isLast ? "Last" : undefined,
                onSelect: () => moveColumn(projectId, column.id, index + 1),
              },
              {
                label: "Delete list",
                icon: <Trash2 />,
                danger: true,
                disabled: !canDeleteColumn(columns),
                hint: canDeleteColumn(columns) ? undefined : "Only list",
                onSelect: () => onRequestDelete(column.id),
              },
            ]}
          />
        )}
      </div>
    </header>
  );
}
