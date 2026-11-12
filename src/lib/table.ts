/**
 * Sorting the List view's table — plain functions, no React.
 * Click a column heading once to sort by it, again to flip the direction.
 */
import type { Priority, Task } from "./types";

export const TABLE_SORT_KEYS = ["title", "list", "priority", "due", "assignee", "updated"] as const;
export type TableSortKey = (typeof TABLE_SORT_KEYS)[number];
export type SortDirection = "asc" | "desc";

/** One line of the table: the task plus the facts we show and sort by. */
export interface TableRow {
  task: Task;
  /** Position of its list on the board (0 = first list). */
  columnIndex: number;
  columnTitle: string;
  /** "" when nobody is assigned. */
  assigneeName: string;
  isDone: boolean;
}

/** The direction a column starts with when you first click it. */
export function defaultDirection(key: TableSortKey): SortDirection {
  return key === "updated" ? "desc" : "asc"; // newest changes first feels natural
}

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

/** Is this row missing the value we sort by? (Those always go to the bottom.) */
function isEmpty(row: TableRow, key: TableSortKey): boolean {
  if (key === "due") return row.task.dueDate === null;
  if (key === "assignee") return row.assigneeName === "";
  return false;
}

function compare(a: TableRow, b: TableRow, key: TableSortKey): number {
  switch (key) {
    case "title":
      return a.task.title.localeCompare(b.task.title);
    case "list":
      return a.columnIndex - b.columnIndex;
    case "priority": // "ascending" = most important first
      return PRIORITY_RANK[a.task.priority] - PRIORITY_RANK[b.task.priority];
    case "due":
      return (a.task.dueDate ?? "").localeCompare(b.task.dueDate ?? "");
    case "assignee":
      return a.assigneeName.localeCompare(b.assigneeName);
    case "updated":
      return a.task.updatedAt.localeCompare(b.task.updatedAt);
  }
}

/**
 * Returns the rows in order. Rules:
 *  - rows with no due date / no assignee always go LAST, whichever direction;
 *  - ties keep the board's order, so nothing jumps around randomly.
 */
export function sortTableRows(
  rows: readonly TableRow[],
  key: TableSortKey,
  direction: SortDirection,
): TableRow[] {
  const flip = direction === "asc" ? 1 : -1;
  return rows
    .map((row, position) => ({ row, position }))
    .sort((x, y) => {
      const xEmpty = isEmpty(x.row, key);
      const yEmpty = isEmpty(y.row, key);
      if (xEmpty !== yEmpty) return xEmpty ? 1 : -1;
      return compare(x.row, y.row, key) * flip || x.position - y.position;
    })
    .map((entry) => entry.row);
}
