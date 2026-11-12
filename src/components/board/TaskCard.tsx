"use client";

import { memo, type CSSProperties, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlignLeft, Calendar, Flag, MessageSquare, Trash2 } from "lucide-react";
import { Avatar, Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDay } from "@/lib/dates";
import { getDueStatus } from "@/lib/tasks";
import type { Label, Member, Priority, Task } from "@/lib/types";

const PRIORITY_STYLE: Record<Priority, { label: string; className: string }> = {
  low: { label: "Low", className: "text-muted" },
  medium: { label: "Medium", className: "text-primary" },
  high: { label: "High", className: "text-warning" },
  urgent: { label: "Urgent", className: "text-danger" },
};

const DUE_TONE = {
  done: "success",
  overdue: "danger",
  soon: "warning",
  later: "neutral",
} as const;

export interface TaskCardViewProps {
  task: Task;
  labels: Label[];
  assignee: Member | undefined;
  /** Is the task in the board's last ("done") column? */
  isDone: boolean;
  today: string;
  /** The floating copy that follows the mouse while dragging. */
  overlay?: boolean;
}

/**
 * What a card LOOKS like (no dragging logic). Used for the cards in the lists
 * and for the floating copy under the mouse while dragging.
 * `memo`: a card only redraws when its own data changes.
 */
export const TaskCardView = memo(function TaskCardView({
  task,
  labels,
  assignee,
  isDone,
  today,
  overlay = false,
}: TaskCardViewProps) {
  const taskLabels = labels.filter((label) => task.labelIds.includes(label.id));
  const dueStatus = task.dueDate ? getDueStatus(task.dueDate, isDone, today) : null;
  const priority = PRIORITY_STYLE[task.priority];

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 text-left shadow-sm",
        "transition-[box-shadow,border-color] duration-200",
        overlay
          ? "rotate-2 cursor-grabbing border-accent/60 shadow-2xl shadow-primary/25"
          : "group-hover:border-accent/50 group-hover:shadow-md",
      )}
    >
      {taskLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {taskLabels.map((label) => (
            <Badge key={label.id} color={label.color}>
              {label.name}
            </Badge>
          ))}
        </div>
      )}

      <p className={cn("text-sm leading-snug font-medium", isDone && "text-muted line-through")}>
        {task.title}
      </p>

      <div className="flex items-center gap-1.5 text-muted">
        <span title={`${priority.label} priority`} className={cn("flex", priority.className)}>
          <Flag className="size-3.5" aria-label={`${priority.label} priority`} />
        </span>

        {dueStatus && task.dueDate && (
          <Badge
            tone={DUE_TONE[dueStatus]}
            icon={<Calendar className="size-3" aria-hidden="true" />}
          >
            <span className="sr-only">
              {dueStatus === "overdue" ? "Overdue, due " : "Due "}
            </span>
            {formatDay(task.dueDate).replace(/ \d{4}$/, "")}
          </Badge>
        )}

        {task.description && (
          <AlignLeft className="size-3.5" aria-label="Has a description" />
        )}

        {task.comments.length > 0 && (
          <span className="flex items-center gap-0.5 text-[11px] font-semibold">
            <MessageSquare className="size-3.5" aria-hidden="true" />
            <span className="sr-only">Comments: </span>
            {task.comments.length}
          </span>
        )}

        {assignee && (
          <Avatar name={assignee.name} color={assignee.color} size="xs" className="ml-auto" />
        )}
      </div>
    </div>
  );
});

interface SortableTaskCardProps extends TaskCardViewProps {
  projectId: string;
  /** Viewers and archived projects can look but not drag or delete. */
  disabled: boolean;
  /** Asks the board to delete this task (the board shows "Are you sure?"). */
  onDelete: (taskId: string) => void;
}

/** A card in a list that can be dragged with the mouse, a finger or the keyboard. */
export function SortableTaskCard({
  projectId,
  disabled,
  onDelete,
  ...view
}: SortableTaskCardProps) {
  const router = useRouter();
  const href = `/projects/${projectId}/tasks/${view.task.id}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: view.task.id, disabled });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    listeners?.onKeyDown?.(event); // Space picks the card up (dnd-kit)
    // Enter opens the card, but NOT while it is being moved with the keyboard
    // (that would open a pop-up in the middle of the move).
    if (event.key === "Enter" && !isDragging && !event.defaultPrevented) router.push(href);
  }

  return (
    // Outer box: moves while dragging. It holds two separate things side by
    // side: the draggable card, and the delete button (a button must not sit
    // INSIDE another button-like element).
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group relative", isDragging && "opacity-40")}
    >
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative rounded-xl outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted",
          disabled ? "cursor-pointer" : "cursor-grab touch-manipulation",
          // While dragging, the card's old spot shows a soft dashed "hole".
          isDragging && "[&>div]:border-dashed [&>div]:border-accent",
        )}
      >
        <TaskCardView {...view} />
        {/* Clicking the card opens the task. Not a separate Tab stop: the
            card itself is focusable and Enter opens it. */}
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 rounded-xl"
          draggable={false}
        />
      </div>

      {!disabled && !isDragging && (
        <button
          type="button"
          aria-label={`Delete ${view.task.title}`}
          title="Delete task"
          onClick={() => onDelete(view.task.id)}
          className={cn(
            "absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-lg",
            "border border-border bg-surface text-muted shadow-sm transition-all",
            "hover:border-danger/40 hover:bg-danger/10 hover:text-danger",
            "focus-visible:outline-2 focus-visible:outline-danger",
            // Hidden until you hover the card or Tab to it; always visible on
            // touch screens, which have no hover.
            "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100",
            "[@media(hover:none)]:opacity-100",
          )}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
