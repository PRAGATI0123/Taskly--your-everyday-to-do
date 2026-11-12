/**
 * The shape of every piece of data in Taskly.
 * No logic lives here — only descriptions that TypeScript checks for us.
 */

/** Every item gets a unique text id, e.g. "3f9c1a2e-...". */
export type ID = string;

/** A date and time saved as text, e.g. "2026-11-10T09:30:00.000Z". */
export type ISODateTime = string;

/** A calendar day saved as text, e.g. "2026-11-24". */
export type ISODate = string;

// ---------------------------------------------------------------------------
// Fixed choices
// ---------------------------------------------------------------------------

/** Task priorities, from least to most important. */
export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

/** What a person is allowed to do inside a project. */
export const MEMBER_ROLES = ["owner", "admin", "member", "viewer"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

/** A person in the team who can be assigned to tasks. */
export interface Member {
  id: ID;
  name: string;
  /** Colour of the avatar circle, e.g. "#a86b40". */
  color: string;
}

/** Links a member to a project with a role. */
export interface ProjectMember {
  memberId: ID;
  role: MemberRole;
}

// ---------------------------------------------------------------------------
// Projects and the board
// ---------------------------------------------------------------------------

/** A coloured tag that can be stuck on tasks, e.g. "Bug" or "Design". */
export interface Label {
  id: ID;
  name: string;
  color: string;
}

/**
 * One column of the Kanban board, e.g. "To Do".
 * `taskIds` holds the tasks in this column, in the order shown top to bottom.
 * Business rule: the LAST column of a project counts as "done".
 */
export interface Column {
  id: ID;
  title: string;
  taskIds: ID[];
}

/** A project owns one Kanban board (its columns) plus its labels and members. */
export interface Project {
  id: ID;
  name: string;
  description: string;
  columns: Column[];
  labels: Label[];
  members: ProjectMember[];
  archived: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Tasks and what lives inside them
// ---------------------------------------------------------------------------

/** One tickable line in a task's checklist (our "subtasks"). */
export interface ChecklistItem {
  id: ID;
  text: string;
  done: boolean;
}

/** A message someone wrote on a task. */
export interface Comment {
  id: ID;
  authorId: ID;
  text: string;
  createdAt: ISODateTime;
}

/** One line in a task's history, e.g. "Moved from To Do to Done". */
export interface ActivityEntry {
  id: ID;
  /** Who did it. `null` for things the app did by itself. */
  actorId: ID | null;
  message: string;
  at: ISODateTime;
}

/**
 * A single card on the board.
 * Note: a task does NOT store which column it is in. The column's `taskIds`
 * list is the only place that says where a task lives, so the two can never
 * disagree.
 */
export interface Task {
  id: ID;
  projectId: ID;
  title: string;
  description: string;
  priority: Priority;
  /** `null` means nobody is assigned yet. */
  assigneeId: ID | null;
  labelIds: ID[];
  /** `null` means there is no due date. */
  dueDate: ISODate | null;
  checklist: ChecklistItem[];
  comments: Comment[];
  /** Oldest first. */
  activity: ActivityEntry[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Everything together
// ---------------------------------------------------------------------------

/**
 * All of the app's data in one object — this is what gets saved in the browser.
 * Projects and tasks are kept in "dictionaries" (id -> item) so we can find
 * any item instantly by its id instead of searching through a list.
 */
export interface TasklyData {
  members: Member[];
  projects: Record<ID, Project>;
  tasks: Record<ID, Task>;
}
