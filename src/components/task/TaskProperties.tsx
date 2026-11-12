"use client";

import { useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { Badge, Button, IconButton, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDay, formatRelativeTime } from "@/lib/dates";
import { getDueStatus } from "@/lib/tasks";
import { PRIORITIES, type Column, type Member, type Priority, type Project, type Task } from "@/lib/types";
import { useTasklyStore } from "@/store/tasklyStore";

const PRIORITY_NAMES: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const DUE_TEXT = {
  done: { tone: "success", text: "Done" },
  overdue: { tone: "danger", text: "Overdue" },
  soon: { tone: "warning", text: "Due soon" },
  later: { tone: "neutral", text: "Upcoming" },
} as const;

interface TaskPropertiesProps {
  task: Task;
  project: Project;
  column: Column | undefined;
  isDone: boolean;
  members: Member[];
  canEdit: boolean;
  today: string;
  onDelete: () => void;
}

/** The side panel: which list, priority, who, when, labels — and Delete. */
export function TaskProperties({
  task,
  project,
  column,
  isDone,
  members,
  canEdit,
  today,
  onDelete,
}: TaskPropertiesProps) {
  const updateTask = useTasklyStore((state) => state.updateTask);
  const moveTask = useTasklyStore((state) => state.moveTask);
  const [error, setError] = useState<string | null>(null);

  /** Runs a store action and shows its error (if any). */
  function run(result: { ok: boolean; error?: string }) {
    setError(result.ok ? null : (result.error ?? "Something went wrong."));
  }

  // Only people in this project can be assigned.
  const projectMembers = project.members
    .map((pm) => members.find((m) => m.id === pm.memberId))
    .filter((m): m is Member => m !== undefined);

  const dueStatus = task.dueDate ? getDueStatus(task.dueDate, isDone, today) : null;

  return (
    <aside className="flex flex-col gap-4">
      {/* Changing the list moves the card on the board (to the bottom). */}
      <Select
        label="List"
        disabled={!canEdit}
        value={column?.id ?? ""}
        options={project.columns.map((c) => ({ value: c.id, label: c.title }))}
        onChange={(event) =>
          run(moveTask(task.id, event.target.value, Number.MAX_SAFE_INTEGER))
        }
      />

      <Select
        label="Priority"
        disabled={!canEdit}
        value={task.priority}
        options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_NAMES[p] }))}
        onChange={(event) =>
          run(updateTask(task.id, { priority: event.target.value as Priority }))
        }
      />

      <Select
        label="Assigned to"
        disabled={!canEdit}
        value={task.assigneeId ?? ""}
        placeholder="Nobody"
        options={projectMembers.map((m) => ({ value: m.id, label: m.name }))}
        onChange={(event) =>
          run(updateTask(task.id, { assigneeId: event.target.value || null }))
        }
      />

      <div className="flex flex-col gap-1.5">
        <Input
          label="Due date"
          type="date"
          disabled={!canEdit}
          value={task.dueDate ?? ""}
          onChange={(event) =>
            run(updateTask(task.id, { dueDate: event.target.value || null }))
          }
          trailing={
            task.dueDate && canEdit ? (
              <IconButton
                size="sm"
                icon={<X className="size-4" />}
                label="Remove due date"
                onClick={() => run(updateTask(task.id, { dueDate: null }))}
              />
            ) : undefined
          }
        />
        {dueStatus && task.dueDate && (
          <Badge tone={DUE_TEXT[dueStatus].tone} className="w-fit">
            {DUE_TEXT[dueStatus].text} · {formatDay(task.dueDate)}
          </Badge>
        )}
      </div>

      {/* Labels: click to stick a label on, click again to peel it off. */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Labels</legend>
        <div className="flex flex-wrap gap-1.5">
          {project.labels.map((label) => {
            const on = task.labelIds.includes(label.id);
            return (
              <button
                key={label.id}
                type="button"
                disabled={!canEdit}
                aria-pressed={on}
                onClick={() =>
                  run(
                    updateTask(task.id, {
                      labelIds: on
                        ? task.labelIds.filter((id) => id !== label.id)
                        : [...task.labelIds, label.id],
                    }),
                  )
                }
                className={cn(
                  "rounded-full transition-all focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed",
                  !on && "opacity-45 grayscale hover:opacity-80 hover:grayscale-0",
                )}
              >
                <Badge color={label.color} icon={on ? <Check className="size-3" /> : undefined}>
                  {label.name}
                </Badge>
              </button>
            );
          })}
          {project.labels.length === 0 && (
            <p className="text-xs text-muted">This project has no labels.</p>
          )}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4 text-xs text-muted">
        <p>Created {formatRelativeTime(task.createdAt)}</p>
        <p>Updated {formatRelativeTime(task.updatedAt)}</p>
        {canEdit && (
          <Button
            variant="secondary"
            size="sm"
            icon={<Trash2 className="size-4" />}
            onClick={onDelete}
            className="mt-2 w-full text-danger hover:border-danger/40 hover:bg-danger/10"
          >
            Delete task
          </Button>
        )}
      </div>
    </aside>
  );
}
