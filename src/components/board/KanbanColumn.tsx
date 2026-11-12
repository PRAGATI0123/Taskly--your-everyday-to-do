"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/cn";
import type { Column, ID, Member, Project, Task } from "@/lib/types";
import { useTasklyStore } from "@/store/tasklyStore";
import { ColumnHeader } from "./ColumnHeader";
import { InlineComposer } from "./InlineComposer";
import { SortableTaskCard } from "./TaskCard";

interface KanbanColumnProps {
  project: Project;
  column: Column;
  /** The cards to show, in order (may differ from the store while dragging). */
  taskIds: ID[];
  /** How many cards the list really has (some may be hidden by filters). */
  totalCount: number;
  tasks: Record<ID, Task>;
  members: Member[];
  /** Is this the last column (the "done" one)? */
  isDoneColumn: boolean;
  canEdit: boolean;
  /** May rename, move and delete lists (owners/admins, not archived). */
  canManage: boolean;
  today: string;
  /** Asks the board to delete a task (it shows the "Are you sure?" pop-up). */
  onDeleteTask: (taskId: ID) => void;
  /** Asks the board to delete this list (it shows the "Delete list?" pop-up). */
  onDeleteColumn: (columnId: ID) => void;
}

/** One list on the board: its title, its cards, and "+ Add a card". */
export const KanbanColumn = memo(function KanbanColumn({
  project,
  column,
  taskIds,
  totalCount,
  tasks,
  members,
  isDoneColumn,
  canEdit,
  canManage,
  today,
  onDeleteTask,
  onDeleteColumn,
}: KanbanColumnProps) {
  const createTask = useTasklyStore((state) => state.createTask);

  // Makes the whole list a place you can drop a card, even when it's empty.
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <section
      aria-label={`${column.title} list, ${taskIds.length} cards`}
      className={cn(
        "flex max-h-full w-72 shrink-0 flex-col rounded-2xl border border-border/80 bg-surface-muted/70 shadow-sm backdrop-blur transition-colors",
        isOver && "border-accent/60 bg-surface-muted",
      )}
    >
      <ColumnHeader
        projectId={project.id}
        column={column}
        columns={project.columns}
        cardCount={taskIds.length}
        totalCount={totalCount}
        isDoneColumn={isDoneColumn}
        canManage={canManage}
        onRequestDelete={onDeleteColumn}
      />

      <SortableContext id={column.id} items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="flex min-h-12 flex-1 flex-col gap-2 overflow-y-auto px-2 pt-0.5 pb-2"
        >
          {taskIds.map((taskId) => {
            const task = tasks[taskId];
            if (!task) return null;
            return (
              <SortableTaskCard
                key={taskId}
                projectId={project.id}
                task={task}
                labels={project.labels}
                assignee={members.find((m) => m.id === task.assigneeId)}
                isDone={isDoneColumn}
                today={today}
                disabled={!canEdit}
                onDelete={onDeleteTask}
              />
            );
          })}
          {taskIds.length === 0 && (
            <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted">
              {totalCount > 0 ? "No matching cards" : canEdit ? "Drop cards here" : "No cards"}
            </p>
          )}
        </div>
      </SortableContext>

      {canEdit && (
        <div className="px-2 pb-2">
          <InlineComposer
            openLabel="Add a card"
            submitLabel="Add card"
            placeholder="Enter a title for this card…"
            multiline
            onSubmit={(title) => {
              const result = createTask(project.id, column.id, { title });
              return result.ok ? null : result.error;
            }}
          />
        </div>
      )}
    </section>
  );
});
