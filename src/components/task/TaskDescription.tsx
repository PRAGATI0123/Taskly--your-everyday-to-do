"use client";

import { useState } from "react";
import { AlignLeft } from "lucide-react";
import { Button, Textarea } from "@/components/ui";
import { TASK_DESCRIPTION_MAX_LENGTH } from "@/lib/tasks";
import type { Task } from "@/lib/types";
import { useTasklyStore } from "@/store/tasklyStore";
import { Section } from "./Section";

/** The longer notes about a task. Shown as text; click Edit to change. */
export function TaskDescription({ task, canEdit }: { task: Task; canEdit: boolean }) {
  const updateTask = useTasklyStore((state) => state.updateTask);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function open() {
    setDraft(task.description);
    setError(null);
    setEditing(true);
  }

  function save() {
    const result = updateTask(task.id, { description: draft });
    if (!result.ok) return setError(result.error);
    setEditing(false);
  }

  return (
    <Section
      icon={<AlignLeft />}
      title="Description"
      action={
        canEdit && !editing && task.description ? (
          <Button variant="secondary" size="sm" onClick={open}>
            Edit
          </Button>
        ) : undefined
      }
    >
      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            aria-label="Description"
            rows={5}
            autoFocus
            placeholder="Add more details, links or notes…"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation(); // don't close the whole pop-up
                setEditing(false);
              }
            }}
            error={error}
            hint={`${draft.length}/${TASK_DESCRIPTION_MAX_LENGTH}`}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={save}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : task.description ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{task.description}</p>
      ) : canEdit ? (
        <button
          type="button"
          onClick={open}
          className="w-full rounded-xl bg-surface-muted px-3 py-4 text-left text-sm text-muted transition-colors hover:bg-surface-muted/70 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        >
          Add a more detailed description…
        </button>
      ) : (
        <p className="text-sm text-muted">No description.</p>
      )}
    </Section>
  );
}
