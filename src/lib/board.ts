/**
 * Board logic: plain functions that change the Kanban board.
 *
 * Rules every function here follows:
 *  1. No screens, no React, no saving — just data in, data out.
 *  2. Never change the data we are given. Always return a NEW copy.
 *     (React notices changes by spotting new objects, and the old data stays
 *     safe if something goes wrong.)
 */
import type { Column, ID, Project } from "./types";

// ---------------------------------------------------------------------------
// Small list helpers
// ---------------------------------------------------------------------------

/** Keeps a number between a minimum and a maximum. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Returns a copy of the list with `item` placed at `index`. */
export function insertAt<T>(list: readonly T[], index: number, item: T): T[] {
  const copy = [...list];
  copy.splice(clamp(index, 0, copy.length), 0, item);
  return copy;
}

/** Returns a copy of the list with the item at `from` moved to `to`. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length) return [...list];
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  if (item === undefined) return copy;
  copy.splice(clamp(to, 0, copy.length), 0, item);
  return copy;
}

// ---------------------------------------------------------------------------
// Looking things up
// ---------------------------------------------------------------------------

/** Which column is this task in? `undefined` if it is on no column. */
export function findColumnOfTask(
  columns: readonly Column[],
  taskId: ID,
): Column | undefined {
  return columns.find((column) => column.taskIds.includes(taskId));
}

/** Business rule: the LAST column of the board is the "done" column. */
export function getDoneColumn(columns: readonly Column[]): Column | undefined {
  return columns.at(-1);
}

/** Is this task sitting in the "done" column? */
export function isTaskDone(columns: readonly Column[], taskId: ID): boolean {
  return getDoneColumn(columns)?.taskIds.includes(taskId) ?? false;
}

// ---------------------------------------------------------------------------
// Tasks on the board
// ---------------------------------------------------------------------------

/**
 * Puts a task into a column at a position (default: the bottom).
 * If the task was already somewhere on the board, it is taken out first,
 * so a task can never appear twice.
 */
export function addTaskToColumn(
  columns: readonly Column[],
  columnId: ID,
  taskId: ID,
  index: number = Number.POSITIVE_INFINITY,
): Column[] {
  if (!columns.some((column) => column.id === columnId)) return [...columns];

  return removeTaskFromColumns(columns, taskId).map((column) =>
    column.id === columnId
      ? { ...column, taskIds: insertAt(column.taskIds, index, taskId) }
      : column,
  );
}

/** Takes a task off the board (from whichever column it is in). */
export function removeTaskFromColumns(
  columns: readonly Column[],
  taskId: ID,
): Column[] {
  return columns.map((column) =>
    column.taskIds.includes(taskId)
      ? { ...column, taskIds: column.taskIds.filter((id) => id !== taskId) }
      : column,
  );
}

/**
 * Moves a task to `toColumnId` at position `toIndex`.
 * This one function handles BOTH kinds of drag-and-drop:
 *  - moving up/down inside the same column, and
 *  - moving to a different column.
 * `toIndex` is the position the task should end up at in the target column.
 */
export function moveTask(
  columns: readonly Column[],
  taskId: ID,
  toColumnId: ID,
  toIndex: number,
): Column[] {
  const fromColumn = findColumnOfTask(columns, taskId);
  const toColumn = columns.find((column) => column.id === toColumnId);
  if (!fromColumn || !toColumn) return [...columns];

  // Same column: just reorder.
  if (fromColumn.id === toColumn.id) {
    const fromIndex = fromColumn.taskIds.indexOf(taskId);
    return columns.map((column) =>
      column.id === fromColumn.id
        ? { ...column, taskIds: moveItem(column.taskIds, fromIndex, toIndex) }
        : column,
    );
  }

  // Different column: take it out of one, put it into the other.
  return addTaskToColumn(columns, toColumnId, taskId, toIndex);
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

export const COLUMN_TITLE_MAX_LENGTH = 40;

/**
 * Checks a column name. Returns an error message, or `null` if it is fine.
 * `ignoreColumnId` lets a column keep its own name when it is being renamed.
 */
export function validateColumnTitle(
  title: string,
  columns: readonly Column[],
  ignoreColumnId?: ID,
): string | null {
  const clean = title.trim();
  if (clean.length === 0) return "Column name can't be empty.";
  if (clean.length > COLUMN_TITLE_MAX_LENGTH) {
    return `Column name must be ${COLUMN_TITLE_MAX_LENGTH} characters or fewer.`;
  }
  const taken = columns.some(
    (column) =>
      column.id !== ignoreColumnId &&
      column.title.trim().toLowerCase() === clean.toLowerCase(),
  );
  if (taken) return "A column with this name already exists.";
  return null;
}

/**
 * Adds a new, empty column JUST BEFORE the last one.
 * Business rule: the last column means "done", so a new list must not push
 * "Done" out of last place (that would suddenly make finished tasks unfinished).
 */
export function addColumn(
  columns: readonly Column[],
  columnId: ID,
  title: string,
): Column[] {
  const newColumn: Column = { id: columnId, title: title.trim(), taskIds: [] };
  return insertAt(columns, Math.max(columns.length - 1, 0), newColumn);
}

/** Gives a column a new name. */
export function renameColumn(
  columns: readonly Column[],
  columnId: ID,
  title: string,
): Column[] {
  return columns.map((column) =>
    column.id === columnId ? { ...column, title: title.trim() } : column,
  );
}

/** Moves a column left or right to a new position. */
export function moveColumn(
  columns: readonly Column[],
  columnId: ID,
  toIndex: number,
): Column[] {
  const fromIndex = columns.findIndex((column) => column.id === columnId);
  return moveItem(columns, fromIndex, toIndex);
}

/** Business rule: a board must always keep at least one column. */
export function canDeleteColumn(columns: readonly Column[]): boolean {
  return columns.length > 1;
}

/**
 * Deletes a column. Its tasks either move to another column
 * (`moveTasksToColumnId`) or are deleted too (pass `null`).
 * Returns the new columns AND the ids of tasks that must be deleted.
 */
export function deleteColumn(
  columns: readonly Column[],
  columnId: ID,
  moveTasksToColumnId: ID | null,
): { columns: Column[]; deletedTaskIds: ID[] } {
  const doomed = columns.find((column) => column.id === columnId);
  if (!doomed || !canDeleteColumn(columns)) {
    return { columns: [...columns], deletedTaskIds: [] };
  }

  const remaining = columns.filter((column) => column.id !== columnId);
  const target = remaining.find((column) => column.id === moveTasksToColumnId);

  if (target) {
    return {
      columns: remaining.map((column) =>
        column.id === target.id
          ? { ...column, taskIds: [...column.taskIds, ...doomed.taskIds] }
          : column,
      ),
      deletedTaskIds: [],
    };
  }

  return { columns: remaining, deletedTaskIds: [...doomed.taskIds] };
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export interface Progress {
  done: number;
  total: number;
  /** Whole number from 0 to 100. */
  percent: number;
}

/** How much of a project is finished? (tasks in the last column ÷ all tasks) */
export function getProjectProgress(project: Pick<Project, "columns">): Progress {
  const total = project.columns.reduce(
    (sum, column) => sum + column.taskIds.length,
    0,
  );
  const done = getDoneColumn(project.columns)?.taskIds.length ?? 0;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, percent };
}
