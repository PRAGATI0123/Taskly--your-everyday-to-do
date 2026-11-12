import { formatDay, isBeforeDay } from "./dates";
import { createId } from "./id";
import type {
  ActivityEntry,
  ID,
  ISODate,
  ISODateTime,
  Priority,
  Task,
} from "./types";

export const TASK_TITLE_MAX_LENGTH = 120;
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;
export const COMMENT_MAX_LENGTH = 1000;
export const CHECKLIST_ITEM_MAX_LENGTH = 200;

/** How close a task's due date is. */
export type DueStatus = "done" | "overdue" | "soon" | "later";

const SOON_DAYS = 2;

/**
 * Business rules for due dates:
 *  - a task in the "done" column is "done", whatever its date
 *  - before today → "overdue"
 *  - today or within the next 2 days → "soon"
 *  - otherwise → "later"
 */
export function getDueStatus(
  dueDate: ISODate,
  isDone: boolean,
  today: ISODate,
): DueStatus {
  if (isDone) return "done";
  if (isBeforeDay(dueDate, today)) return "overdue";
  const days = Math.round(
    (Date.parse(`${dueDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
  );
  return days <= SOON_DAYS ? "soon" : "later";
}

/** What you can fill in when making a task. Only the title is required. */
export interface NewTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  assigneeId?: ID | null;
  labelIds?: ID[];
  dueDate?: ISODate | null;
}

/** The fields of a task that can be edited after it is made. */
export type TaskChanges = Partial<
  Pick<
    Task,
    "title" | "description" | "priority" | "assigneeId" | "labelIds" | "dueDate"
  >
>;

/** Checks a task title. Returns an error message, or `null` if it is fine. */
export function validateTaskTitle(title: string): string | null {
  const clean = title.trim();
  if (clean.length === 0) return "Task title can't be empty.";
  if (clean.length > TASK_TITLE_MAX_LENGTH) {
    return `Task title must be ${TASK_TITLE_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

/** Checks a task description. Returns an error message, or `null`. */
export function validateTaskDescription(description: string): string | null {
  if (description.length > TASK_DESCRIPTION_MAX_LENGTH) {
    return `Description must be ${TASK_DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

/** Checks short text like a comment or checklist item. */
export function validateShortText(
  text: string,
  maxLength: number,
  what: string,
): string | null {
  const clean = text.trim();
  if (clean.length === 0) return `${what} can't be empty.`;
  if (clean.length > maxLength) {
    return `${what} must be ${maxLength} characters or fewer.`;
  }
  return null;
}

/** Builds a brand-new task, filling in sensible defaults. */
export function buildTask(
  projectId: ID,
  input: NewTaskInput,
  now: ISODateTime,
): Task {
  return {
    id: createId(),
    projectId,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    priority: input.priority ?? "medium",
    assigneeId: input.assigneeId ?? null,
    labelIds: input.labelIds ?? [],
    dueDate: input.dueDate ?? null,
    checklist: [],
    comments: [],
    activity: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Returns a copy of the task with one more line in its history. */
export function addActivity(
  task: Task,
  message: string,
  actorId: ID | null,
  at: ISODateTime,
): Task {
  const entry: ActivityEntry = { id: createId(), actorId, message, at };
  return { ...task, activity: [...task.activity, entry], updatedAt: at };
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Compares a task with the changes about to be made and describes them in
 * plain words for the history, e.g. ["Changed priority from Low to High"].
 * Fields that did not really change are skipped.
 */
export function describeTaskChanges(
  before: Task,
  changes: TaskChanges,
  names: { member: (id: ID) => string; label: (id: ID) => string },
): string[] {
  const messages: string[] = [];

  if (changes.title !== undefined && changes.title.trim() !== before.title) {
    messages.push(`Renamed the task to "${changes.title.trim()}"`);
  }
  if (
    changes.description !== undefined &&
    changes.description.trim() !== before.description
  ) {
    messages.push("Updated the description");
  }
  if (changes.priority !== undefined && changes.priority !== before.priority) {
    messages.push(
      `Changed priority from ${capitalize(before.priority)} to ${capitalize(changes.priority)}`,
    );
  }
  if (changes.assigneeId !== undefined && changes.assigneeId !== before.assigneeId) {
    messages.push(
      changes.assigneeId === null
        ? "Removed the assignee"
        : `Assigned this task to ${names.member(changes.assigneeId)}`,
    );
  }
  if (changes.dueDate !== undefined && changes.dueDate !== before.dueDate) {
    messages.push(
      changes.dueDate === null
        ? "Removed the due date"
        : `Set the due date to ${formatDay(changes.dueDate)}`,
    );
  }
  if (changes.labelIds !== undefined) {
    for (const id of changes.labelIds) {
      if (!before.labelIds.includes(id)) messages.push(`Added label ${names.label(id)}`);
    }
    for (const id of before.labelIds) {
      if (!changes.labelIds.includes(id)) {
        messages.push(`Removed label ${names.label(id)}`);
      }
    }
  }

  return messages;
}
