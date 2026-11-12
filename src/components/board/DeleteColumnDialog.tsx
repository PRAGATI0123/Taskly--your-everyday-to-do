"use client";

import { useState } from "react";
import { Button, Modal, Select } from "@/components/ui";
import type { Column, ID } from "@/lib/types";
import { useTasklyStore } from "@/store/tasklyStore";

interface DeleteColumnDialogProps {
  projectId: ID;
  /** The list to delete, or undefined when the pop-up is closed. */
  column: Column | undefined;
  columns: Column[];
  onClose: () => void;
}

/**
 * "Delete list?" — if the list has cards, you choose what happens to them:
 * move them to another list (the safe default) or delete them too.
 */
export function DeleteColumnDialog({ projectId, column, columns, onClose }: DeleteColumnDialogProps) {
  return (
    <Modal open={column !== undefined} onClose={onClose} title="Delete list?" size="sm">
      {/* Separate component, so its choices start fresh each time it opens. */}
      {column && (
        <DeleteColumnForm
          projectId={projectId}
          column={column}
          columns={columns}
          onDone={onClose}
        />
      )}
    </Modal>
  );
}

function DeleteColumnForm({
  projectId,
  column,
  columns,
  onDone,
}: {
  projectId: ID;
  column: Column;
  columns: Column[];
  onDone: () => void;
}) {
  const deleteColumn = useTasklyStore((state) => state.deleteColumn);
  const others = columns.filter((c) => c.id !== column.id);
  const cardCount = column.taskIds.length;

  // Default: move the cards to the list on the left (or the first other list).
  const index = columns.findIndex((c) => c.id === column.id);
  const defaultTarget = (columns[index - 1] ?? others[0])?.id ?? "";

  const [choice, setChoice] = useState<"move" | "delete">("move");
  const [targetId, setTargetId] = useState(defaultTarget);
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    const moveTo = cardCount > 0 && choice === "move" ? targetId : null;
    const result = deleteColumn(projectId, column.id, moveTo);
    if (result.ok) onDone();
    else setError(result.error);
  }

  const cardWord = cardCount === 1 ? "card" : "cards";

  return (
    <div className="flex flex-col gap-4 text-sm">
      {cardCount === 0 ? (
        <p className="text-muted">
          The list <strong className="text-foreground">{column.title}</strong> is empty and
          will be removed.
        </p>
      ) : (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-muted">
            The list <strong className="text-foreground">{column.title}</strong> has{" "}
            {cardCount} {cardWord}. What should happen to {cardCount === 1 ? "it" : "them"}?
          </legend>

          <label className="flex items-start gap-2.5 rounded-xl border border-border p-3 has-checked:border-accent has-checked:bg-primary/5">
            <input
              type="radio"
              name="cards"
              checked={choice === "move"}
              onChange={() => setChoice("move")}
              className="mt-0.5 accent-primary"
            />
            <span className="flex flex-1 flex-col gap-2">
              <span className="font-medium">Move the {cardWord} to another list</span>
              {choice === "move" && (
                <Select
                  aria-label="Move cards to"
                  options={others.map((c) => ({ value: c.id, label: c.title }))}
                  value={targetId}
                  onChange={(event) => setTargetId(event.target.value)}
                />
              )}
            </span>
          </label>

          <label className="flex items-start gap-2.5 rounded-xl border border-border p-3 has-checked:border-danger/50 has-checked:bg-danger/5">
            <input
              type="radio"
              name="cards"
              checked={choice === "delete"}
              onChange={() => setChoice("delete")}
              className="mt-0.5 accent-danger"
            />
            <span className="flex flex-col">
              <span className="font-medium text-danger">Delete the {cardWord} too</span>
              <span className="text-xs text-muted">This can&apos;t be undone.</span>
            </span>
          </label>
        </fieldset>
      )}

      {error && (
        <p role="alert" className="font-medium text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="secondary" onClick={onDone} data-autofocus>
          Cancel
        </Button>
        <Button variant="danger" onClick={confirm}>
          Delete list
        </Button>
      </div>
    </div>
  );
}
