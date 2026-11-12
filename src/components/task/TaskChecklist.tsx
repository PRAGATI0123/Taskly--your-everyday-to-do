"use client";

import { useState } from "react";
import { CheckSquare, X } from "lucide-react";
import { InlineComposer } from "@/components/board/InlineComposer";
import { IconButton, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Task } from "@/lib/types";
import { useTasklyStore } from "@/store/tasklyStore";
import { Section } from "./Section";

/** Small steps inside a task, each with a tick box (our "subtasks"). */
export function TaskChecklist({ task, canEdit }: { task: Task; canEdit: boolean }) {
  const addChecklistItem = useTasklyStore((state) => state.addChecklistItem);
  const toggleChecklistItem = useTasklyStore((state) => state.toggleChecklistItem);
  const deleteChecklistItem = useTasklyStore((state) => state.deleteChecklistItem);
  const [error, setError] = useState<string | null>(null);

  const done = task.checklist.filter((item) => item.done).length;
  const total = task.checklist.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  if (!canEdit && total === 0) return null;

  return (
    <Section icon={<CheckSquare />} title="Checklist">
      {total > 0 && (
        <div className="flex items-center gap-3">
          <span className="w-9 text-xs font-semibold text-muted tabular-nums">{percent}%</span>
          <ProgressBar value={percent} label="Checklist progress" />
        </div>
      )}

      <ul className="flex flex-col gap-0.5">
        {task.checklist.map((item) => (
          <li
            key={item.id}
            className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-surface-muted"
          >
            <input
              type="checkbox"
              id={`check-${item.id}`}
              checked={item.done}
              disabled={!canEdit}
              onChange={() => {
                const result = toggleChecklistItem(task.id, item.id);
                setError(result.ok ? null : result.error);
              }}
              className="size-4 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
            />
            <label
              htmlFor={`check-${item.id}`}
              className={cn(
                "flex-1 cursor-pointer text-sm transition-colors",
                item.done && "text-muted line-through",
              )}
            >
              {item.text}
            </label>
            {canEdit && (
              <IconButton
                size="sm"
                variant="danger"
                icon={<X className="size-3.5" />}
                label={`Remove "${item.text}"`}
                onClick={() => {
                  const result = deleteChecklistItem(task.id, item.id);
                  setError(result.ok ? null : result.error);
                }}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
              />
            )}
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}

      {canEdit && (
        <InlineComposer
          openLabel="Add an item"
          submitLabel="Add"
          placeholder="Add an item…"
          onSubmit={(text) => {
            const result = addChecklistItem(task.id, text);
            return result.ok ? null : result.error;
          }}
          className="bg-surface-muted/60"
        />
      )}
    </Section>
  );
}
