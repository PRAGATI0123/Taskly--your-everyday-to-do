import { getDoneColumn, getProjectProgress, type Progress } from "./board";
import { isBeforeDay } from "./dates";
import { createId } from "./id";
import type { ID, ISODate, ISODateTime, Label, Project, Task } from "./types";

/** The numbers shown on a project card. */
export interface ProjectStats extends Progress {
  /** Tasks whose due date has passed and that are not done yet. */
  overdue: number;
}

/**
 * Works out a project's progress and how many tasks are overdue.
 * Business rule: a task in the last ("done") column is never overdue.
 */
export function getProjectStats(
  project: Project,
  tasks: Record<ID, Task>,
  today: ISODate,
): ProjectStats {
  const doneIds = new Set(getDoneColumn(project.columns)?.taskIds ?? []);
  let overdue = 0;
  for (const column of project.columns) {
    for (const taskId of column.taskIds) {
      const due = tasks[taskId]?.dueDate;
      if (due && !doneIds.has(taskId) && isBeforeDay(due, today)) overdue++;
    }
  }
  return { ...getProjectProgress(project), overdue };
}

export const PROJECT_NAME_MAX_LENGTH = 60;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 300;

/** Every new project starts with these columns (the last one means "done"). */
export const DEFAULT_COLUMN_TITLES = ["To Do", "In Progress", "Review", "Done"];

/** Every new project starts with these labels. */
export const DEFAULT_LABELS: Omit<Label, "id">[] = [
  { name: "Bug", color: "#b42318" },
  { name: "Feature", color: "#3f6212" },
  { name: "Design", color: "#a86b40" },
  { name: "Docs", color: "#475569" },
];

export const LABEL_NAME_MAX_LENGTH = 24;

/** The colours you can pick for a label (all readable in light and dark mode). */
export const LABEL_COLORS = [
  { value: "#b42318", name: "Red" },
  { value: "#c2410c", name: "Orange" },
  { value: "#b45309", name: "Amber" },
  { value: "#3f6212", name: "Olive" },
  { value: "#0f766e", name: "Teal" },
  { value: "#1d4ed8", name: "Blue" },
  { value: "#7c3aed", name: "Violet" },
  { value: "#be185d", name: "Pink" },
  { value: "#a86b40", name: "Caramel" },
  { value: "#475569", name: "Slate" },
] as const;

/**
 * Checks a label name: not empty, not too long, and not the same as another
 * label in the project ("bug" counts as the same as "Bug").
 * `ignoreLabelId` lets a label keep its own name when it is renamed.
 */
export function validateLabelName(
  name: string,
  labels: readonly Label[],
  ignoreLabelId?: ID,
): string | null {
  const clean = name.trim();
  if (clean.length === 0) return "Label name can't be empty.";
  if (clean.length > LABEL_NAME_MAX_LENGTH) {
    return `Label name must be ${LABEL_NAME_MAX_LENGTH} characters or fewer.`;
  }
  const taken = labels.some(
    (label) =>
      label.id !== ignoreLabelId && label.name.trim().toLowerCase() === clean.toLowerCase(),
  );
  return taken ? "A label with this name already exists." : null;
}

/** Checks a project name. Returns an error message, or `null` if it is fine. */
export function validateProjectName(name: string): string | null {
  const clean = name.trim();
  if (clean.length === 0) return "Project name can't be empty.";
  if (clean.length > PROJECT_NAME_MAX_LENGTH) {
    return `Project name must be ${PROJECT_NAME_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

/** Checks a project description. Returns an error message, or `null`. */
export function validateProjectDescription(description: string): string | null {
  if (description.trim().length > PROJECT_DESCRIPTION_MAX_LENGTH) {
    return `Description must be ${PROJECT_DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

/** Builds a brand-new project. The person who creates it becomes its owner. */
export function buildProject(
  input: { name: string; description: string; ownerId: ID },
  now: ISODateTime,
): Project {
  return {
    id: createId(),
    name: input.name.trim(),
    description: input.description.trim(),
    columns: DEFAULT_COLUMN_TITLES.map((title) => ({
      id: createId(),
      title,
      taskIds: [],
    })),
    labels: DEFAULT_LABELS.map((label) => ({ ...label, id: createId() })),
    members: [{ memberId: input.ownerId, role: "owner" }],
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
}
