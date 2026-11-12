"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Calendar,
  ChevronDown,
  ChevronUp,
  Flag,
  ListX,
  SearchX,
} from "lucide-react";
import { BoardToolbar } from "@/components/board/BoardToolbar";
import { Avatar, Badge, EmptyState, IconButton, Select } from "@/components/ui";
import { useBoardFilters } from "@/hooks/useBoardFilters";
import { cn } from "@/lib/cn";
import { formatDay, formatRelativeTime, todayISODate } from "@/lib/dates";
import { taskMatches } from "@/lib/filters";
import { canEditTasks } from "@/lib/permissions";
import {
  defaultDirection,
  sortTableRows,
  type SortDirection,
  type TableRow,
  type TableSortKey,
} from "@/lib/table";
import { getDueStatus } from "@/lib/tasks";
import type { Priority } from "@/lib/types";
import { useMyRole, useProject } from "@/store/selectors";
import { useTasklyStore } from "@/store/tasklyStore";

const PRIORITY: Record<Priority, { label: string; tone: "neutral" | "primary" | "warning" | "danger" }> = {
  urgent: { label: "Urgent", tone: "danger" },
  high: { label: "High", tone: "warning" },
  medium: { label: "Medium", tone: "primary" },
  low: { label: "Low", tone: "neutral" },
};

const DUE_TONE = { done: "success", overdue: "danger", soon: "warning", later: "neutral" } as const;

/** The choices in the List view's "Sort" drop-down (one per sortable column). */
const SORT_OPTIONS: { value: TableSortKey; label: string }[] = [
  { value: "list", label: "Sort: Board order" },
  { value: "title", label: "Sort: Task name" },
  { value: "priority", label: "Sort: Priority" },
  { value: "due", label: "Sort: Due date" },
  { value: "assignee", label: "Sort: Assigned to" },
  { value: "updated", label: "Sort: Last updated" },
];

const COLUMNS: { key: TableSortKey; label: string; className?: string }[] = [
  { key: "title", label: "Task", className: "w-[34%]" },
  { key: "list", label: "List" },
  { key: "priority", label: "Priority" },
  { key: "due", label: "Due" },
  { key: "assignee", label: "Assigned to" },
  { key: "updated", label: "Updated" },
];

/** The List view: every task of the project in one sortable table. */
export function TaskTable({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const project = useProject(projectId);
  const tasks = useTasklyStore((state) => state.tasks);
  const members = useTasklyStore((state) => state.members);
  const currentUserId = useTasklyStore((state) => state.currentUserId);
  const moveTask = useTasklyStore((state) => state.moveTask);
  const role = useMyRole(projectId);
  const { filters, sort, setFilter, setSort, clearFilters } = useBoardFilters();

  // Which heading the table is sorted by (default: the board's own order).
  const [sortKey, setSortKey] = useState<TableSortKey>("list");
  const [direction, setDirection] = useState<SortDirection>("asc");
  const today = todayISODate();

  // Build one row per task, in board order, then filter and sort.
  const { rows, total } = useMemo(() => {
    if (!project) return { rows: [], total: 0 };
    const lastIndex = project.columns.length - 1;
    const all: TableRow[] = project.columns.flatMap((column, columnIndex) =>
      column.taskIds.flatMap((id) => {
        const task = tasks[id];
        if (!task) return [];
        const assignee = members.find((m) => m.id === task.assigneeId);
        return [
          {
            task,
            columnIndex,
            columnTitle: column.title,
            assigneeName: assignee?.name ?? "",
            isDone: columnIndex === lastIndex,
          },
        ];
      }),
    );
    const matching = all.filter((row) =>
      taskMatches(row.task, filters, { isDone: row.isDone, today, currentUserId }),
    );
    return { rows: sortTableRows(matching, sortKey, direction), total: all.length };
  }, [project, tasks, members, filters, today, currentUserId, sortKey, direction]);

  if (!project) {
    return (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title="Project not found"
        description="It may have been deleted. Pick another project from your list."
      />
    );
  }

  const canEdit = canEditTasks(role) && !project.archived;

  function clickHeading(key: TableSortKey) {
    if (key === sortKey) {
      setDirection((d) => (d === "asc" ? "desc" : "asc")); // same heading: flip
    } else {
      setSortKey(key);
      setDirection(defaultDirection(key));
    }
  }

  return (
    <div className="flex flex-col gap-3 pb-8">
      <BoardToolbar
        filters={filters}
        sort={sort}
        labels={project.labels}
        shownCount={rows.length}
        totalCount={total}
        onFilterChange={setFilter}
        onSortChange={setSort}
        onClear={clearFilters}
        showSort={false}
        sortControl={
          // The drop-down and the clickable headings share the SAME state
          // (sortKey + direction), so they always agree with each other.
          <div className="flex items-center gap-1">
            <div className="w-44">
              <Select
                aria-label="Sort tasks"
                className="h-9 text-xs sm:text-sm"
                value={sortKey}
                options={SORT_OPTIONS}
                onChange={(event) => {
                  const key = event.target.value as TableSortKey;
                  setSortKey(key);
                  setDirection(defaultDirection(key));
                }}
              />
            </div>
            <IconButton
              variant="secondary"
              size="sm"
              icon={
                direction === "asc" ? (
                  <ArrowUpNarrowWide className="size-4" />
                ) : (
                  <ArrowDownWideNarrow className="size-4" />
                )
              }
              label={
                direction === "asc"
                  ? "Ascending order. Click for descending."
                  : "Descending order. Click for ascending."
              }
              onClick={() => setDirection((d) => (d === "asc" ? "desc" : "asc"))}
              className="size-9"
            />
          </div>
        }
      />

      {total === 0 ? (
        <EmptyState
          icon={<ListX className="size-6" />}
          title="No tasks yet"
          description="Add cards on the Board tab and they will show up here as a list."
        />
      ) : (
        // On small screens the table scrolls sideways instead of squashing.
        <div className="animate-fade-up overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <caption className="sr-only">
              Tasks in {project.name}, sorted by {sortKey} ({direction === "asc" ? "ascending" : "descending"})
            </caption>
            <thead className="bg-surface-muted/70 text-left text-xs font-semibold text-muted">
              <tr>
                {COLUMNS.map((column) => {
                  const active = sortKey === column.key;
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      // Tells screen readers which column the table is sorted by.
                      aria-sort={
                        active ? (direction === "asc" ? "ascending" : "descending") : undefined
                      }
                      className={cn("border-b border-border px-3 py-2.5", column.className)}
                    >
                      <button
                        type="button"
                        onClick={() => clickHeading(column.key)}
                        title={`Sort by ${column.label}`}
                        className={cn(
                          "-mx-1.5 inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors",
                          "hover:bg-surface hover:text-foreground",
                          "focus-visible:outline-2 focus-visible:outline-primary",
                          active && "bg-surface text-foreground shadow-sm",
                        )}
                      >
                        {column.label}
                        {/* ▲ and ▼ always visible; the current direction lights up. */}
                        <span aria-hidden="true" className="flex flex-col">
                          <ChevronUp
                            className={cn(
                              "-mb-1 size-3.5",
                              active && direction === "asc" ? "text-primary" : "opacity-35",
                            )}
                            strokeWidth={3}
                          />
                          <ChevronDown
                            className={cn(
                              "size-3.5",
                              active && direction === "desc" ? "text-primary" : "opacity-35",
                            )}
                            strokeWidth={3}
                          />
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {rows.map(({ task, columnTitle, isDone }) => {
                const assignee = members.find((m) => m.id === task.assigneeId);
                const due = task.dueDate ? getDueStatus(task.dueDate, isDone, today) : null;
                const taskLabels = project.labels.filter((l) => task.labelIds.includes(l.id));
                const currentColumn = project.columns.find((c) => c.taskIds.includes(task.id));
                return (
                  <tr
                    key={task.id}
                    className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-muted/50"
                  >
                    <td className="px-3 py-2.5 align-top">
                      {/* Opens the same task pop-up as on the board. */}
                      <Link
                        href={`/projects/${project.id}/tasks/${task.id}`}
                        className={cn(
                          "font-medium hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary",
                          isDone && "text-muted line-through",
                        )}
                      >
                        {task.title}
                      </Link>
                      {taskLabels.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {taskLabels.map((label) => (
                            <Badge key={label.id} color={label.color}>
                              {label.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-2.5 align-top">
                      {canEdit ? (
                        // Change the list right here: the card moves on the board too.
                        <select
                          aria-label={`List for ${task.title}`}
                          value={currentColumn?.id ?? ""}
                          onChange={(event) =>
                            moveTask(task.id, event.target.value, Number.MAX_SAFE_INTEGER)
                          }
                          className="h-8 cursor-pointer rounded-lg border border-border bg-surface px-2 text-xs font-medium hover:border-accent/60 focus:ring-4 focus:ring-primary/15 focus:outline-none"
                        >
                          {project.columns.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-medium">{columnTitle}</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 align-top">
                      <Badge
                        tone={PRIORITY[task.priority].tone}
                        icon={<Flag className="size-3" aria-hidden="true" />}
                      >
                        {PRIORITY[task.priority].label}
                      </Badge>
                    </td>

                    <td className="px-3 py-2.5 align-top">
                      {task.dueDate && due ? (
                        <Badge tone={DUE_TONE[due]} icon={<Calendar className="size-3" aria-hidden="true" />}>
                          {due === "overdue" && <span className="sr-only">Overdue, </span>}
                          {formatDay(task.dueDate)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 align-top">
                      {assignee ? (
                        <span className="flex items-center gap-2 text-xs">
                          <Avatar name={assignee.name} color={assignee.color} size="xs" />
                          {assignee.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">Nobody</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 align-top text-xs whitespace-nowrap text-muted">
                      <time dateTime={task.updatedAt}>{formatRelativeTime(task.updatedAt)}</time>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-3 py-10 text-center text-sm text-muted">
                    No tasks match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
