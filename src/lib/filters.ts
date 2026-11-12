/**
 * Filtering and sorting the cards on a board — plain functions, no React.
 *
 * The choices live in the web address, e.g.
 *   /projects/abc/board?q=login&priority=high&sort=due
 * so a refresh keeps them and the link can be shared.
 */
import { getDueStatus } from "./tasks";
import { PRIORITIES, type ID, type ISODate, type Priority, type Task } from "./types";

export const DUE_FILTERS = ["all", "overdue", "soon", "none"] as const;
export type DueFilter = (typeof DUE_FILTERS)[number];

export const ASSIGNEE_FILTERS = ["all", "me", "unassigned"] as const;
export type AssigneeFilter = (typeof ASSIGNEE_FILTERS)[number];

export const SORT_ORDERS = ["manual", "priority", "due", "title", "newest"] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export interface BoardFilters {
  /** Words to find in the title or description. */
  query: string;
  priority: Priority | "all";
  /** A label id, or "all". */
  labelId: ID | "all";
  due: DueFilter;
  assignee: AssigneeFilter;
}

export const NO_FILTERS: BoardFilters = {
  query: "",
  priority: "all",
  labelId: "all",
  due: "all",
  assignee: "all",
};

// ---------------------------------------------------------------------------
// Reading and writing the web address
// ---------------------------------------------------------------------------

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Reads the filters from the address. Anything unknown is ignored (safe). */
export function parseBoardParams(params: URLSearchParams): {
  filters: BoardFilters;
  sort: SortOrder;
} {
  return {
    filters: {
      query: params.get("q") ?? "",
      priority: pick(params.get("priority"), [...PRIORITIES, "all"], "all"),
      labelId: params.get("label") || "all",
      due: pick(params.get("due"), DUE_FILTERS, "all"),
      assignee: pick(params.get("assignee"), ASSIGNEE_FILTERS, "all"),
    },
    sort: pick(params.get("sort"), SORT_ORDERS, "manual"),
  };
}

/** Writes the filters into an address query. Defaults are left out to keep it short. */
export function toBoardParams(filters: BoardFilters, sort: SortOrder): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query);
  if (filters.priority !== "all") params.set("priority", filters.priority);
  if (filters.labelId !== "all") params.set("label", filters.labelId);
  if (filters.due !== "all") params.set("due", filters.due);
  if (filters.assignee !== "all") params.set("assignee", filters.assignee);
  if (sort !== "manual") params.set("sort", sort);
  return params;
}

/** How many filters are switched on (for the "Clear (2)" button). */
export function countActiveFilters(filters: BoardFilters): number {
  return (
    Number(filters.query.trim() !== "") +
    Number(filters.priority !== "all") +
    Number(filters.labelId !== "all") +
    Number(filters.due !== "all") +
    Number(filters.assignee !== "all")
  );
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

export interface MatchContext {
  /** Is the task in the board's last ("done") list? */
  isDone: boolean;
  today: ISODate;
  currentUserId: ID | null;
}

/** Does this task pass every filter that is switched on? */
export function taskMatches(task: Task, filters: BoardFilters, ctx: MatchContext): boolean {
  const query = filters.query.trim().toLowerCase();
  if (
    query &&
    !task.title.toLowerCase().includes(query) &&
    !task.description.toLowerCase().includes(query)
  ) {
    return false;
  }

  if (filters.priority !== "all" && task.priority !== filters.priority) return false;
  if (filters.labelId !== "all" && !task.labelIds.includes(filters.labelId)) return false;

  if (filters.due === "none" && task.dueDate !== null) return false;
  if (filters.due === "overdue" || filters.due === "soon") {
    if (!task.dueDate) return false;
    if (getDueStatus(task.dueDate, ctx.isDone, ctx.today) !== filters.due) return false;
  }

  if (filters.assignee === "me" && task.assigneeId !== ctx.currentUserId) return false;
  if (filters.assignee === "unassigned" && task.assigneeId !== null) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

/**
 * Returns the ids in the chosen order. "manual" keeps the order you dragged.
 * Ties keep their manual order, so cards don't jump around randomly.
 */
export function sortTaskIds(
  ids: readonly ID[],
  tasks: Record<ID, Task>,
  sort: SortOrder,
): ID[] {
  if (sort === "manual") return [...ids];

  const compare = (a: Task, b: Task): number => {
    switch (sort) {
      case "priority":
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      case "due":
        // Cards without a date go last.
        if (a.dueDate === b.dueDate) return 0;
        if (a.dueDate === null) return 1;
        if (b.dueDate === null) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      case "title":
        return a.title.localeCompare(b.title);
      case "newest":
        return b.createdAt.localeCompare(a.createdAt);
      default:
        return 0;
    }
  };

  return ids
    .map((id, position) => ({ id, position, task: tasks[id] }))
    .sort((x, y) => {
      if (!x.task || !y.task) return 0;
      return compare(x.task, y.task) || x.position - y.position;
    })
    .map((entry) => entry.id);
}

// ---------------------------------------------------------------------------
// Dropping into a filtered list
// ---------------------------------------------------------------------------

/**
 * When some cards are hidden, the position you drop at on screen is not the
 * same as the position in the full list. We find the visible card you dropped
 * it ABOVE (or below) and use that card's place in the full list.
 *
 * @param fullList  the target list's saved order (may include hidden cards)
 * @param visibleList  the order shown on screen after the drop
 * @returns the index for `moveTask` (position after the card is taken out)
 */
export function resolveDropIndex(
  fullList: readonly ID[],
  visibleList: readonly ID[],
  activeId: ID,
): number {
  const full = fullList.filter((id) => id !== activeId);
  const position = visibleList.indexOf(activeId);
  const next = visibleList[position + 1];
  const previous = visibleList[position - 1];
  if (next !== undefined && full.includes(next)) return full.indexOf(next);
  if (previous !== undefined && full.includes(previous)) return full.indexOf(previous) + 1;
  return full.length;
}
