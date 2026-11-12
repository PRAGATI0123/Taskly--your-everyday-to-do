"use client";

import { use, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Archive, SearchX } from "lucide-react";
import { Button, ConfirmDialog, EmptyState } from "@/components/ui";
import { useBoardFilters } from "@/hooks/useBoardFilters";
import { todayISODate } from "@/lib/dates";
import { resolveDropIndex, sortTaskIds, taskMatches } from "@/lib/filters";
import { canEditTasks, canManageProject } from "@/lib/permissions";
import type { ID, Project } from "@/lib/types";
import { useMyRole, useProject } from "@/store/selectors";
import { useTasklyStore } from "@/store/tasklyStore";
import { BoardToolbar } from "./BoardToolbar";
import { DeleteColumnDialog } from "./DeleteColumnDialog";
import { InlineComposer } from "./InlineComposer";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCardView } from "./TaskCard";

/** Which cards are in which list: { columnId: [taskId, taskId, …] } */
type ColumnItems = Record<ID, ID[]>;

/** The board page: finds the project, then shows the board (or "not found"). */
export function KanbanBoard({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const project = useProject(projectId);

  if (!project) {
    return (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title="Project not found"
        description="It may have been deleted. Pick another project from your list."
        action={
          <Link href="/projects" className="text-sm font-semibold text-primary underline">
            Go to all projects
          </Link>
        }
      />
    );
  }
  return <Board project={project} />;
}

function Board({ project }: { project: Project }) {
  const tasks = useTasklyStore((state) => state.tasks);
  const members = useTasklyStore((state) => state.members);
  const moveTask = useTasklyStore((state) => state.moveTask);
  const addColumn = useTasklyStore((state) => state.addColumn);
  const setProjectArchived = useTasklyStore((state) => state.setProjectArchived);
  const deleteTask = useTasklyStore((state) => state.deleteTask);

  // The task waiting for "Are you sure?" (null = no pop-up).
  const [deletingId, setDeletingId] = useState<ID | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // The list waiting for "Delete list?" (null = no pop-up).
  const [deletingColumnId, setDeletingColumnId] = useState<ID | null>(null);

  function closeDelete() {
    setDeletingId(null);
    setDeleteError(null);
  }

  function confirmDelete() {
    if (!deletingId) return;
    const result = deleteTask(deletingId);
    if (result.ok) closeDelete();
    else setDeleteError(result.error);
  }
  const role = useMyRole(project.id);
  const currentUserId = useTasklyStore((state) => state.currentUserId);
  const today = todayISODate();
  const { filters, sort, setFilter, setSort, clearFilters } = useBoardFilters();

  // Business rule: viewers and archived projects are read-only.
  const canEdit = canEditTasks(role) && !project.archived;
  const canManage = canManageProject(role) && !project.archived;

  const doneColumnId = project.columns.at(-1)?.id;

  // The cards to SHOW in each list: only those matching the filters, in the
  // chosen order. (The store keeps the full list; nothing is deleted.)
  const savedItems = useMemo<ColumnItems>(
    () =>
      Object.fromEntries(
        project.columns.map((column) => {
          const ctx = { isDone: column.id === doneColumnId, today, currentUserId };
          const matching = column.taskIds.filter((id) => {
            const task = tasks[id];
            return task !== undefined && taskMatches(task, filters, ctx);
          });
          return [column.id, sortTaskIds(matching, tasks, sort)];
        }),
      ),
    [project.columns, tasks, filters, sort, today, currentUserId, doneColumnId],
  );

  const totalCount = project.columns.reduce((sum, c) => sum + c.taskIds.length, 0);
  const shownCount = Object.values(savedItems).reduce((sum, ids) => sum + ids.length, 0);

  // While dragging we move cards in a TEMPORARY copy, so the lists make room
  // under the mouse. Only when the card is dropped do we save to the store.
  const [draftItems, setDraftItems] = useState<ColumnItems | null>(null);
  const [activeId, setActiveId] = useState<ID | null>(null);
  const items = draftItems ?? savedItems;

  // The keyboard helper below is created when a drag starts, so it would only
  // ever see the board as it was at that moment. A ref always holds the latest.
  const itemsRef = useRef(items);
  useLayoutEffect(() => {
    itemsRef.current = items;
  });

  /**
   * Where the card goes when an arrow key is pressed during a keyboard drag.
   *  ← / → : jump to the previous / next LIST (in our own column order).
   *  ↑ / ↓ : dnd-kit's helper moves it within the list.
   * (dnd-kit's helper alone sometimes picked a card in the SAME list for ←/→,
   * because cards in one list line up to within a fraction of a pixel.)
   */
  const keyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
    if (event.code !== "ArrowLeft" && event.code !== "ArrowRight") {
      return sortableKeyboardCoordinates(event, args);
    }
    event.preventDefault();
    const { active, over, droppableRects } = args.context;
    if (!active) return undefined;

    const columnIds = project.columns.map((c) => c.id);
    const current = findColumn(over?.id ?? active.id, itemsRef.current);
    const step = event.code === "ArrowRight" ? 1 : -1;
    const targetId = current ? columnIds[columnIds.indexOf(current) + step] : undefined;
    const target = targetId ? droppableRects.get(targetId) : undefined;
    return target ? { x: target.left, y: target.top } : undefined;
  };

  const sensors = useSensors(
    // Mouse: start dragging after moving 6px, so a normal click still opens the card.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Touch: press and hold briefly, so swiping still scrolls the board.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    // Keyboard: Space picks up / drops, arrows move, Esc cancels.
    useSensor(KeyboardSensor, {
      coordinateGetter: keyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );

  /** Which list holds this id? (The id can be a list itself or a card.) */
  function findColumn(id: UniqueIdentifier, from: ColumnItems = items): ID | undefined {
    const key = String(id);
    if (key in from) return key;
    return Object.keys(from).find((columnId) => from[columnId]?.includes(key));
  }

  const columnTitle = (id: ID | undefined) =>
    project.columns.find((c) => c.id === id)?.title ?? "a list";
  const taskTitle = (id: UniqueIdentifier) => tasks[String(id)]?.title ?? "card";

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    setDraftItems(savedItems);
  }

  /** The card moved over ANOTHER list: move it there in the temporary copy. */
  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    setDraftItems((current) => {
      const draft = current ?? savedItems;
      const fromColumn = findColumn(active.id, draft);
      const toColumn = findColumn(over.id, draft);
      if (!fromColumn || !toColumn || fromColumn === toColumn) return draft;

      const fromList = draft[fromColumn] ?? [];
      const toList = draft[toColumn] ?? [];
      const overIndex = toList.indexOf(String(over.id));

      // Dropping on the list itself → bottom. On a card → above it, or below
      // it if the dragged card's middle is past that card's middle.
      let newIndex = toList.length;
      if (overIndex >= 0) {
        const activeRect = active.rect.current.translated;
        const isBelow =
          activeRect !== null && activeRect.top > over.rect.top + over.rect.height / 2;
        newIndex = overIndex + (isBelow ? 1 : 0);
      }

      return {
        ...draft,
        [fromColumn]: fromList.filter((id) => id !== String(active.id)),
        [toColumn]: [...toList.slice(0, newIndex), String(active.id), ...toList.slice(newIndex)],
      };
    });
  }

  /** The card was dropped: work out its final place and save it. */
  function handleDragEnd({ active, over }: DragEndEvent) {
    const draft = draftItems ?? savedItems;
    const taskId = String(active.id);
    const column = findColumn(taskId, draft);
    const startColumn = findColumn(taskId, savedItems);

    if (over && column) {
      let list = draft[column] ?? [];
      const overColumn = findColumn(over.id, draft);
      // Moving up/down inside the same list.
      if (overColumn === column) {
        const oldIndex = list.indexOf(taskId);
        const newIndex = String(over.id) in draft ? list.length - 1 : list.indexOf(String(over.id));
        if (oldIndex !== newIndex && newIndex >= 0) list = arrayMove(list, oldIndex, newIndex);
      }

      if (sort === "manual") {
        // Some cards may be hidden by filters, so turn the position on screen
        // into the right position in the FULL list before saving.
        const fullList = project.columns.find((c) => c.id === column)?.taskIds ?? [];
        moveTask(taskId, column, resolveDropIndex(fullList, list, taskId));
      } else if (column !== startColumn) {
        // While sorted, the order inside a list isn't yours to set, so a card
        // moved to another list simply goes to the bottom of your own order.
        moveTask(taskId, column, Number.MAX_SAFE_INTEGER);
      }
    }

    setDraftItems(null);
    setActiveId(null);
  }

  function handleDragCancel() {
    setDraftItems(null);
    setActiveId(null);
  }

  // What screen readers say while a card is moved with the keyboard.
  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Picked up ${taskTitle(active.id)}. Use the arrow keys to move, Space to drop, Escape to cancel.`,
    onDragOver: ({ active, over }) =>
      over ? `${taskTitle(active.id)} is over ${columnTitle(findColumn(over.id))}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${taskTitle(active.id)} dropped in ${columnTitle(findColumn(over.id))}.`
        : `${taskTitle(active.id)} dropped.`,
    onDragCancel: ({ active }) => `Moving ${taskTitle(active.id)} was cancelled.`,
  };

  const activeTask = activeId ? tasks[activeId] : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <BoardToolbar
        filters={filters}
        sort={sort}
        labels={project.labels}
        shownCount={shownCount}
        totalCount={totalCount}
        onFilterChange={setFilter}
        onSortChange={setSort}
        onClear={clearFilters}
      />

      {project.archived && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning">
          <Archive className="size-4" aria-hidden="true" />
          <span className="flex-1 font-medium">
            This project is archived, so the board is read-only.
          </span>
          {canManageProject(role) && (
            <Button size="sm" variant="secondary" onClick={() => setProjectArchived(project.id, false)}>
              Restore project
            </Button>
          )}
        </div>
      )}

      <DndContext
        id={`board-${project.id}`}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "To move a card, press Space to pick it up, use the arrow keys to move it, and press Space again to drop it. Press Enter to open it.",
          },
        }}
      >
        {/* The lists sit side by side; the board scrolls sideways like Trello. */}
        <div className="-mx-4 flex min-h-[24rem] flex-1 items-start gap-3 overflow-x-auto px-4 pb-4 lg:-mx-6 lg:px-6 [&>section]:max-h-[calc(100dvh-14rem)]">
          {project.columns.map((column) => (
            <KanbanColumn
              key={column.id}
              project={project}
              column={column}
              taskIds={items[column.id] ?? []}
              totalCount={column.taskIds.length}
              tasks={tasks}
              members={members}
              isDoneColumn={column.id === doneColumnId}
              canEdit={canEdit}
              canManage={canManage}
              today={today}
              onDeleteTask={setDeletingId}
              onDeleteColumn={setDeletingColumnId}
            />
          ))}

          {canManage && (
            <div className="w-72 shrink-0 rounded-2xl bg-surface-muted/40 p-2 backdrop-blur">
              <InlineComposer
                openLabel="Add another list"
                submitLabel="Add list"
                placeholder="Enter list name…"
                onSubmit={(title) => {
                  const result = addColumn(project.id, title);
                  return result.ok ? null : result.error;
                }}
              />
            </div>
          )}
        </div>

        {/* The card that floats under the mouse while dragging. */}
        <DragOverlay>
          {activeTask ? (
            <TaskCardView
              task={activeTask}
              labels={project.labels}
              assignee={members.find((m) => m.id === activeTask.assigneeId)}
              isDone={false}
              today={today}
              overlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <DeleteColumnDialog
        projectId={project.id}
        column={project.columns.find((c) => c.id === deletingColumnId)}
        columns={project.columns}
        onClose={() => setDeletingColumnId(null)}
      />

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete task?"
        confirmLabel="Delete task"
        danger
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={closeDelete}
      >
        <p>
          <strong className="text-foreground">
            {deletingId ? tasks[deletingId]?.title : ""}
          </strong>{" "}
          will be deleted for good, together with its checklist, comments and history.
          This can&apos;t be undone.
        </p>
      </ConfirmDialog>
    </div>
  );
}
