"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, Eye, SearchX, X } from "lucide-react";
import { ConfirmDialog, EmptyState, IconButton } from "@/components/ui";
import { findColumnOfTask } from "@/lib/board";
import { todayISODate } from "@/lib/dates";
import { canEditTasks } from "@/lib/permissions";
import type { ID } from "@/lib/types";
import { useMyRole, useProject, useTask } from "@/store/selectors";
import { useTasklyStore } from "@/store/tasklyStore";
import { TaskActivity } from "./TaskActivity";
import { TaskChecklist } from "./TaskChecklist";
import { TaskComments } from "./TaskComments";
import { TaskDescription } from "./TaskDescription";
import { TaskProperties } from "./TaskProperties";
import { TaskTitle } from "./TaskTitle";

interface TaskDetailsProps {
  projectId: ID;
  taskId: ID;
  /** Shows a ✕ button (used in the pop-up). */
  onClose?: () => void;
  /** Where to go after the task is deleted. */
  onDeleted: () => void;
}

/**
 * Everything about one task. The SAME component is used in two places:
 *   - the pop-up over the board (TaskModal), and
 *   - the full task page (when you open or refresh the task's link).
 */
export function TaskDetails({ projectId, taskId, onClose, onDeleted }: TaskDetailsProps) {
  const task = useTask(taskId);
  const project = useProject(projectId);
  const role = useMyRole(projectId);
  const members = useTasklyStore((state) => state.members);
  const deleteTask = useTasklyStore((state) => state.deleteTask);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!task || !project || task.projectId !== projectId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<SearchX className="size-6" />}
          title="Task not found"
          description="It may have been deleted or moved to another project."
          action={
            <Link
              href={`/projects/${projectId}/board`}
              className="text-sm font-semibold text-primary underline"
            >
              Back to the board
            </Link>
          }
        />
      </div>
    );
  }

  // Business rule: viewers and archived projects are read-only.
  const canEdit = canEditTasks(role) && !project.archived;
  const column = findColumnOfTask(project.columns, task.id);
  const isDone = column !== undefined && column.id === project.columns.at(-1)?.id;
  const today = todayISODate();

  function confirmDelete() {
    const result = deleteTask(taskId);
    if (!result.ok) return setDeleteError(result.error);
    setConfirmingDelete(false);
    onDeleted();
  }

  return (
    <div className="flex flex-col">
      {/* Top: title and where the task lives */}
      <header className="flex items-start gap-3 border-b border-border px-5 pt-5 pb-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <TaskTitle task={task} canEdit={canEdit} />
          <p className="mt-1 text-sm text-muted">
            in list <span className="font-semibold text-foreground">{column?.title ?? "—"}</span>{" "}
            of <span className="font-semibold text-foreground">{project.name}</span>
          </p>
        </div>
        {onClose && (
          <IconButton
            icon={<X className="size-4" />}
            label="Close"
            size="sm"
            onClick={onClose}
            data-autofocus
          />
        )}
      </header>

      {!canEdit && (
        <p className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning sm:mx-6">
          {project.archived ? (
            <Archive className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
          {project.archived
            ? "This project is archived, so this task is read-only."
            : "You can view this task but not change it."}
        </p>
      )}

      {/* Main content on the left, properties on the right (stacked on phones). */}
      <div className="grid gap-8 px-5 py-5 sm:px-6 md:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <TaskDescription task={task} canEdit={canEdit} />
          <TaskChecklist task={task} canEdit={canEdit} />
          <TaskComments task={task} members={members} canEdit={canEdit} />
          <TaskActivity task={task} members={members} />
        </div>

        <TaskProperties
          task={task}
          project={project}
          column={column}
          isDone={isDone}
          members={members}
          canEdit={canEdit}
          today={today}
          onDelete={() => setConfirmingDelete(true)}
        />
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete task?"
        confirmLabel="Delete task"
        danger
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmingDelete(false);
          setDeleteError(null);
        }}
      >
        <p>
          <strong className="text-foreground">{task.title}</strong> will be deleted for good,
          together with its checklist, comments and history. This can&apos;t be undone.
        </p>
      </ConfirmDialog>
    </div>
  );
}
