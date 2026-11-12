"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { TASK_TITLE_MAX_LENGTH } from "@/lib/tasks";
import type { Task } from "@/lib/types";
import { useTasklyStore } from "@/store/tasklyStore";

/** The task's big title. Click it to rename (Enter or clicking away saves, Esc cancels). */
export function TaskTitle({ task, canEdit }: { task: Task; canEdit: boolean }) {
  const updateTask = useTasklyStore((state) => state.updateTask);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [error, setError] = useState<string | null>(null);
  const closedRef = useRef(false); // ignore the "blur" that follows Esc / Enter
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function open() {
    closedRef.current = false;
    setDraft(task.title);
    setError(null);
    setEditing(true);
  }

  function close() {
    closedRef.current = true;
    setEditing(false);
    setError(null);
  }

  /** Returns true if saved (or nothing changed). */
  function save(): boolean {
    if (draft.trim() === task.title) {
      close();
      return true;
    }
    const result = updateTask(task.id, { title: draft });
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    close();
    return true;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter") {
      event.preventDefault(); // titles are one line
      save();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation(); // don't close the whole pop-up
      close();
    }
  }

  const titleClass = "font-display text-2xl leading-snug font-semibold";

  if (!editing) {
    return canEdit ? (
      <button
        type="button"
        onClick={open}
        title="Click to rename"
        className={cn(
          titleClass,
          "-mx-2 rounded-lg px-2 text-left hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-primary",
        )}
      >
        {task.title}
      </button>
    ) : (
      <h2 className={titleClass}>{task.title}</h2>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <textarea
        ref={inputRef}
        aria-label="Task title"
        aria-invalid={error ? true : undefined}
        rows={2}
        maxLength={TASK_TITLE_MAX_LENGTH + 20}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setError(null);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (closedRef.current) return;
          if (!save()) close();
        }}
        className={cn(
          titleClass,
          "-mx-2 w-full resize-none rounded-lg border bg-surface px-2 py-1 focus:ring-4 focus:outline-none",
          error ? "border-danger focus:ring-danger/15" : "border-accent/60 focus:ring-primary/15",
        )}
      />
      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
