/**
 * Small helpers that build test data quickly, so each test only spells out
 * the parts it actually cares about.
 */
import type { Column, Task } from "@/lib/types";

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task",
    projectId: "project",
    title: "A task",
    description: "",
    priority: "medium",
    assigneeId: null,
    labelIds: [],
    dueDate: null,
    checklist: [],
    comments: [],
    activity: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** makeColumns({ todo: ["a", "b"], done: ["c"] }) → two columns in that order. */
export function makeColumns(lists: Record<string, string[]>): Column[] {
  return Object.entries(lists).map(([id, taskIds]) => ({ id, title: id, taskIds }));
}

/** Turns a list of tasks into the { id: task } dictionary the app uses. */
export function byId(tasks: Task[]): Record<string, Task> {
  return Object.fromEntries(tasks.map((task) => [task.id, task]));
}
