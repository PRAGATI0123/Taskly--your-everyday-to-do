/**
 * The app's brain: ONE place that holds all of Taskly's data and every action
 * that changes it. Every page reads from here, so all pages always agree.
 *
 * How each action works:
 *  1. Check the rules (is someone logged in? are they allowed? is the input valid?)
 *  2. Use the plain functions from `lib/` to work out the new data.
 *  3. Save the new data with `set(...)`. Every screen using it redraws by itself.
 *
 * The `persist` wrapper copies the data into IndexedDB after every change, so
 * it survives page refreshes and browser restarts (see storage.ts).
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as board from "@/lib/board";
import { createId, nowISO } from "@/lib/id";
import {
  canDeleteProject,
  canEditTasks,
  canManageProject,
  countOwners,
  getMemberRole,
} from "@/lib/permissions";
import {
  buildProject,
  validateLabelName,
  validateProjectDescription,
  validateProjectName,
} from "@/lib/projects";
import { createSampleData } from "@/lib/sample-data";
import { APP_USER } from "@/lib/user";
import {
  addActivity,
  buildTask,
  CHECKLIST_ITEM_MAX_LENGTH,
  COMMENT_MAX_LENGTH,
  describeTaskChanges,
  validateShortText,
  validateTaskDescription,
  validateTaskTitle,
  type NewTaskInput,
  type TaskChanges,
} from "@/lib/tasks";
import type {
  Column,
  ID,
  MemberRole,
  Project,
  Task,
  TasklyData,
} from "@/lib/types";
import { indexedDBStorage, STORAGE_KEY } from "./storage";

// ---------------------------------------------------------------------------
// Results: every action that can fail tells the screen what went wrong.
// ---------------------------------------------------------------------------

export type ActionResult<T = undefined> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function ok(): ActionResult;
function ok<T>(value: T): ActionResult<T>;
function ok<T>(value?: T): ActionResult<T | undefined> {
  return { ok: true, value };
}

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

// ---------------------------------------------------------------------------
// The shape of the store
// ---------------------------------------------------------------------------

export interface TasklyState extends TasklyData {
  /** Who is using the app. Always the one built-in user (see lib/user.ts). */
  currentUserId: ID | null;
}

export interface TasklyActions {
  // Whole data
  loadData: (data: TasklyData) => void;

  // Projects
  createProject: (input: {
    name: string;
    description: string;
  }) => ActionResult<ID>;
  updateProject: (
    projectId: ID,
    changes: { name?: string; description?: string },
  ) => ActionResult;
  setProjectArchived: (projectId: ID, archived: boolean) => ActionResult;
  deleteProject: (projectId: ID) => ActionResult;

  // Project members
  addProjectMember: (
    projectId: ID,
    memberId: ID,
    role: MemberRole,
  ) => ActionResult;
  setProjectMemberRole: (
    projectId: ID,
    memberId: ID,
    role: MemberRole,
  ) => ActionResult;
  removeProjectMember: (projectId: ID, memberId: ID) => ActionResult;

  // Labels
  addLabel: (projectId: ID, name: string, color: string) => ActionResult<ID>;
  updateLabel: (
    projectId: ID,
    labelId: ID,
    changes: { name?: string; color?: string },
  ) => ActionResult;
  deleteLabel: (projectId: ID, labelId: ID) => ActionResult;

  // Columns
  addColumn: (projectId: ID, title: string) => ActionResult<ID>;
  renameColumn: (projectId: ID, columnId: ID, title: string) => ActionResult;
  moveColumn: (projectId: ID, columnId: ID, toIndex: number) => ActionResult;
  deleteColumn: (
    projectId: ID,
    columnId: ID,
    moveTasksToColumnId: ID | null,
  ) => ActionResult;

  // Tasks
  createTask: (
    projectId: ID,
    columnId: ID,
    input: NewTaskInput,
  ) => ActionResult<ID>;
  updateTask: (taskId: ID, changes: TaskChanges) => ActionResult;
  moveTask: (taskId: ID, toColumnId: ID, toIndex: number) => ActionResult;
  deleteTask: (taskId: ID) => ActionResult;

  // Inside a task
  addChecklistItem: (taskId: ID, text: string) => ActionResult<ID>;
  toggleChecklistItem: (taskId: ID, itemId: ID) => ActionResult;
  deleteChecklistItem: (taskId: ID, itemId: ID) => ActionResult;
  addComment: (taskId: ID, text: string) => ActionResult<ID>;
}

export type TasklyStore = TasklyState & TasklyActions;

export const emptyState: TasklyState = {
  members: [APP_USER],
  projects: {},
  tasks: {},
  currentUserId: APP_USER.id,
};

/** Makes sure the built-in user is always on the team list (with its latest name). */
function withAppUser(members: TasklyData["members"]): TasklyData["members"] {
  return [APP_USER, ...members.filter((m) => m.id !== APP_USER.id)];
}

const NOT_LOGGED_IN = "No user is set up.";
const NO_PROJECT = "This project no longer exists.";
const NO_TASK = "This task no longer exists.";
const CANT_EDIT = "You don't have permission to edit tasks in this project.";
const CANT_MANAGE =
  "Only owners and admins can change this project's settings.";
const ARCHIVED = "This project is archived. Restore it to make changes.";

// ---------------------------------------------------------------------------
// The store
// ---------------------------------------------------------------------------

/**
 * Bump this number whenever the saved data's shape changes (see `migrate`).
 *   1 → login with a demo account + extra sample people
 *   2 → one built-in user, no login, no extra people
 */
const STORAGE_VERSION = 2;

export const useTasklyStore = create<TasklyStore>()(
  persist(
    (set, get) => {
      /** My role in a project (or null if I'm not logged in / not a member). */
      function myRole(project: Project): MemberRole | null {
        const userId = get().currentUserId;
        return userId ? getMemberRole(project, userId) : null;
      }

      /** Saves a changed project, stamping the time it was updated. */
      function saveProject(project: Project) {
        set((state) => ({
          projects: {
            ...state.projects,
            [project.id]: { ...project, updatedAt: nowISO() },
          },
        }));
      }

      /** Saves new columns for a project. */
      function saveColumns(project: Project, columns: Column[]) {
        saveProject({ ...project, columns });
      }

      /** Saves a changed task. */
      function saveTask(task: Task) {
        set((state) => ({ tasks: { ...state.tasks, [task.id]: task } }));
      }

      /** Finds a project and checks that I may manage it. */
      function projectIManage(projectId: ID): ActionResult<Project> {
        const project = get().projects[projectId];
        if (!get().currentUserId) return fail(NOT_LOGGED_IN);
        if (!project) return fail(NO_PROJECT);
        if (!canManageProject(myRole(project))) return fail(CANT_MANAGE);
        return ok(project);
      }

      /** Finds a task (and its project) and checks that I may edit it. */
      function taskIEdit(
        taskId: ID,
      ): ActionResult<{ task: Task; project: Project }> {
        const { currentUserId, tasks, projects } = get();
        const task = tasks[taskId];
        if (!currentUserId) return fail(NOT_LOGGED_IN);
        if (!task) return fail(NO_TASK);
        const project = projects[task.projectId];
        if (!project) return fail(NO_PROJECT);
        if (!canEditTasks(myRole(project))) return fail(CANT_EDIT);
        if (project.archived) return fail(ARCHIVED);
        return ok({ task, project });
      }

      /** Like projectIManage, but for changing the BOARD (not allowed while archived). */
      function boardIManage(projectId: ID): ActionResult<Project> {
        const found = projectIManage(projectId);
        if (found.ok && found.value.archived) return fail(ARCHIVED);
        return found;
      }

      return {
        ...emptyState,

        // ----- Whole data -----------------------------------------------------

        loadData: (data) =>
          set({
            ...data,
            members: withAppUser(data.members),
            currentUserId: APP_USER.id,
          }),

        // ----- Projects -------------------------------------------------------

        createProject: ({ name, description }) => {
          const userId = get().currentUserId;
          if (!userId) return fail(NOT_LOGGED_IN);
          const error =
            validateProjectName(name) ??
            validateProjectDescription(description);
          if (error) return fail(error);

          const project = buildProject(
            { name, description, ownerId: userId },
            nowISO(),
          );
          set((state) => ({
            projects: { ...state.projects, [project.id]: project },
          }));
          return ok(project.id);
        },

        updateProject: (projectId, changes) => {
          const found = projectIManage(projectId);
          if (!found.ok) return found;
          const error =
            (changes.name !== undefined
              ? validateProjectName(changes.name)
              : null) ??
            (changes.description !== undefined
              ? validateProjectDescription(changes.description)
              : null);
          if (error) return fail(error);

          saveProject({
            ...found.value,
            name: changes.name?.trim() ?? found.value.name,
            description: changes.description?.trim() ?? found.value.description,
          });
          return ok();
        },

        setProjectArchived: (projectId, archived) => {
          const found = projectIManage(projectId);
          if (!found.ok) return found;
          saveProject({ ...found.value, archived });
          return ok();
        },

        deleteProject: (projectId) => {
          const project = get().projects[projectId];
          if (!get().currentUserId) return fail(NOT_LOGGED_IN);
          if (!project) return fail(NO_PROJECT);
          if (!canDeleteProject(myRole(project))) {
            return fail("Only the project owner can delete it.");
          }

          set((state) => {
            const projects = { ...state.projects };
            delete projects[projectId];
            // A project's tasks are deleted together with it.
            const tasks = Object.fromEntries(
              Object.entries(state.tasks).filter(
                ([, t]) => t.projectId !== projectId,
              ),
            );
            return { projects, tasks };
          });
          return ok();
        },

        // ----- Project members ------------------------------------------------

        addProjectMember: (projectId, memberId, role) => {
          const found = projectIManage(projectId);
          if (!found.ok) return found;
          const project = found.value;
          if (!get().members.some((m) => m.id === memberId)) {
            return fail("That person isn't on the team.");
          }
          if (getMemberRole(project, memberId)) {
            return fail("That person is already in this project.");
          }
          saveProject({
            ...project,
            members: [...project.members, { memberId, role }],
          });
          return ok();
        },

        setProjectMemberRole: (projectId, memberId, role) => {
          const found = projectIManage(projectId);
          if (!found.ok) return found;
          const project = found.value;
          const current = getMemberRole(project, memberId);
          if (!current) return fail("That person isn't in this project.");
          if (
            current === "owner" &&
            role !== "owner" &&
            countOwners(project) === 1
          ) {
            return fail("A project must always have at least one owner.");
          }
          saveProject({
            ...project,
            members: project.members.map((m) =>
              m.memberId === memberId ? { ...m, role } : m,
            ),
          });
          return ok();
        },

        removeProjectMember: (projectId, memberId) => {
          const found = projectIManage(projectId);
          if (!found.ok) return found;
          const project = found.value;
          const current = getMemberRole(project, memberId);
          if (!current) return fail("That person isn't in this project.");
          if (current === "owner" && countOwners(project) === 1) {
            return fail("A project must always have at least one owner.");
          }
          saveProject({
            ...project,
            members: project.members.filter((m) => m.memberId !== memberId),
          });
          // Their tasks in this project become unassigned.
          set((state) => ({
            tasks: Object.fromEntries(
              Object.entries(state.tasks).map(([id, t]) => [
                id,
                t.projectId === projectId && t.assigneeId === memberId
                  ? { ...t, assigneeId: null }
                  : t,
              ]),
            ),
          }));
          return ok();
        },

        // ----- Labels ---------------------------------------------------------

        addLabel: (projectId, name, color) => {
          const found = projectIManage(projectId);
          if (!found.ok) return found;
          const error = validateLabelName(name, found.value.labels);
          if (error) return fail(error);
          const label = { id: createId(), name: name.trim(), color };
          saveProject({
            ...found.value,
            labels: [...found.value.labels, label],
          });
          return ok(label.id);
        },

        updateLabel: (projectId, labelId, changes) => {
          const found = projectIManage(projectId);
          if (!found.ok) return found;
          if (changes.name !== undefined) {
            const error = validateLabelName(changes.name, found.value.labels, labelId);
            if (error) return fail(error);
          }
          saveProject({
            ...found.value,
            labels: found.value.labels.map((label) =>
              label.id === labelId
                ? {
                    ...label,
                    name: changes.name?.trim() ?? label.name,
                    color: changes.color ?? label.color,
                  }
                : label,
            ),
          });
          return ok();
        },

        deleteLabel: (projectId, labelId) => {
          const found = projectIManage(projectId);
          if (!found.ok) return found;
          saveProject({
            ...found.value,
            labels: found.value.labels.filter((label) => label.id !== labelId),
          });
          // Also peel the label off every task that had it.
          set((state) => ({
            tasks: Object.fromEntries(
              Object.entries(state.tasks).map(([id, t]) => [
                id,
                t.labelIds.includes(labelId)
                  ? { ...t, labelIds: t.labelIds.filter((l) => l !== labelId) }
                  : t,
              ]),
            ),
          }));
          return ok();
        },

        // ----- Columns --------------------------------------------------------

        addColumn: (projectId, title) => {
          const found = boardIManage(projectId);
          if (!found.ok) return found;
          const error = board.validateColumnTitle(title, found.value.columns);
          if (error) return fail(error);
          const columnId = createId();
          saveColumns(
            found.value,
            board.addColumn(found.value.columns, columnId, title),
          );
          return ok(columnId);
        },

        renameColumn: (projectId, columnId, title) => {
          const found = boardIManage(projectId);
          if (!found.ok) return found;
          const error = board.validateColumnTitle(
            title,
            found.value.columns,
            columnId,
          );
          if (error) return fail(error);
          saveColumns(
            found.value,
            board.renameColumn(found.value.columns, columnId, title),
          );
          return ok();
        },

        moveColumn: (projectId, columnId, toIndex) => {
          const found = boardIManage(projectId);
          if (!found.ok) return found;
          saveColumns(
            found.value,
            board.moveColumn(found.value.columns, columnId, toIndex),
          );
          return ok();
        },

        deleteColumn: (projectId, columnId, moveTasksToColumnId) => {
          const found = boardIManage(projectId);
          if (!found.ok) return found;
          if (!board.canDeleteColumn(found.value.columns)) {
            return fail("A board must keep at least one column.");
          }
          const result = board.deleteColumn(
            found.value.columns,
            columnId,
            moveTasksToColumnId,
          );
          saveColumns(found.value, result.columns);
          if (result.deletedTaskIds.length > 0) {
            set((state) => {
              const tasks = { ...state.tasks };
              for (const id of result.deletedTaskIds) delete tasks[id];
              return { tasks };
            });
          }
          return ok();
        },

        // ----- Tasks ----------------------------------------------------------

        createTask: (projectId, columnId, input) => {
          const { currentUserId, projects } = get();
          const project = projects[projectId];
          if (!currentUserId) return fail(NOT_LOGGED_IN);
          if (!project) return fail(NO_PROJECT);
          if (!canEditTasks(myRole(project))) return fail(CANT_EDIT);
          if (project.archived) return fail(ARCHIVED);
          const column = project.columns.find((c) => c.id === columnId);
          if (!column) return fail("That column no longer exists.");
          const error =
            validateTaskTitle(input.title) ??
            validateTaskDescription(input.description ?? "");
          if (error) return fail(error);

          const now = nowISO();
          const task = addActivity(
            buildTask(projectId, input, now),
            `Created this task in ${column.title}`,
            currentUserId,
            now,
          );
          saveTask(task);
          saveColumns(
            project,
            board.addTaskToColumn(project.columns, columnId, task.id),
          );
          return ok(task.id);
        },

        updateTask: (taskId, changes) => {
          const found = taskIEdit(taskId);
          if (!found.ok) return found;
          const { task, project } = found.value;
          const error =
            (changes.title !== undefined
              ? validateTaskTitle(changes.title)
              : null) ??
            (changes.description !== undefined
              ? validateTaskDescription(changes.description)
              : null);
          if (error) return fail(error);

          const { members } = get();
          const messages = describeTaskChanges(task, changes, {
            member: (id) => members.find((m) => m.id === id)?.name ?? "someone",
            label: (id) =>
              project.labels.find((l) => l.id === id)?.name ?? "a label",
          });
          if (messages.length === 0) return ok(); // nothing really changed

          const now = nowISO();
          let updated: Task = {
            ...task,
            ...changes,
            title: changes.title?.trim() ?? task.title,
            description: changes.description?.trim() ?? task.description,
          };
          for (const message of messages) {
            updated = addActivity(updated, message, get().currentUserId, now);
          }
          saveTask(updated);
          return ok();
        },

        moveTask: (taskId, toColumnId, toIndex) => {
          const found = taskIEdit(taskId);
          if (!found.ok) return found;
          const { task, project } = found.value;
          const fromColumn = board.findColumnOfTask(project.columns, taskId);
          const toColumn = project.columns.find((c) => c.id === toColumnId);
          if (!toColumn) return fail("That column no longer exists.");

          saveColumns(
            project,
            board.moveTask(project.columns, taskId, toColumnId, toIndex),
          );
          // Only a move to ANOTHER column is worth a line in the history.
          if (fromColumn && fromColumn.id !== toColumn.id) {
            saveTask(
              addActivity(
                task,
                `Moved from ${fromColumn.title} to ${toColumn.title}`,
                get().currentUserId,
                nowISO(),
              ),
            );
          }
          return ok();
        },

        deleteTask: (taskId) => {
          const found = taskIEdit(taskId);
          if (!found.ok) return found;
          const { project } = found.value;
          saveColumns(
            project,
            board.removeTaskFromColumns(project.columns, taskId),
          );
          set((state) => {
            const tasks = { ...state.tasks };
            delete tasks[taskId];
            return { tasks };
          });
          return ok();
        },

        // ----- Inside a task --------------------------------------------------

        addChecklistItem: (taskId, text) => {
          const found = taskIEdit(taskId);
          if (!found.ok) return found;
          const error = validateShortText(
            text,
            CHECKLIST_ITEM_MAX_LENGTH,
            "Checklist item",
          );
          if (error) return fail(error);
          const item = { id: createId(), text: text.trim(), done: false };
          const task = found.value.task;
          saveTask({
            ...task,
            checklist: [...task.checklist, item],
            updatedAt: nowISO(),
          });
          return ok(item.id);
        },

        toggleChecklistItem: (taskId, itemId) => {
          const found = taskIEdit(taskId);
          if (!found.ok) return found;
          const task = found.value.task;
          saveTask({
            ...task,
            checklist: task.checklist.map((item) =>
              item.id === itemId ? { ...item, done: !item.done } : item,
            ),
            updatedAt: nowISO(),
          });
          return ok();
        },

        deleteChecklistItem: (taskId, itemId) => {
          const found = taskIEdit(taskId);
          if (!found.ok) return found;
          const task = found.value.task;
          saveTask({
            ...task,
            checklist: task.checklist.filter((item) => item.id !== itemId),
            updatedAt: nowISO(),
          });
          return ok();
        },

        addComment: (taskId, text) => {
          const found = taskIEdit(taskId);
          const userId = get().currentUserId;
          if (!found.ok) return found;
          if (!userId) return fail(NOT_LOGGED_IN);
          const error = validateShortText(text, COMMENT_MAX_LENGTH, "Comment");
          if (error) return fail(error);
          const now = nowISO();
          const comment = {
            id: createId(),
            authorId: userId,
            text: text.trim(),
            createdAt: now,
          };
          const task = found.value.task;
          saveTask({
            ...task,
            comments: [...task.comments, comment],
            updatedAt: now,
          });
          return ok(comment.id);
        },
      };
    },
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => indexedDBStorage),
      version: STORAGE_VERSION,

      // Only DATA is saved — never the action functions.
      partialize: (state): TasklyState => ({
        members: state.members,
        projects: state.projects,
        tasks: state.tasks,
        currentUserId: state.currentUserId,
      }),

      // Don't load on import. The app starts loading itself in the browser
      // (StoreProvider), because the server has no IndexedDB.
      skipHydration: true,

      // When saved data comes back, lay it on top of the defaults and make sure
      // the built-in user is on the team and is the one using the app.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<TasklyState>;
        return {
          ...current,
          ...saved,
          members: withAppUser(saved.members ?? current.members),
          currentUserId: APP_USER.id,
        };
      },

      // Upgrades data saved by an older version of the app.
      migrate: (persisted, version): TasklyState => {
        if (version < 2) {
          // Version 1 data belongs to the old demo account and people who no
          // longer exist, so start again with fresh sample data.
          return { ...createSampleData(), currentUserId: APP_USER.id };
        }
        return persisted as TasklyState;
      },
    },
  ),
);
