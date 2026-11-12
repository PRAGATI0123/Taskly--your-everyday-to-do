/**
 * Who is allowed to do what inside a project.
 *
 *            | view | edit tasks | manage project* | delete project
 *   owner    |  ✔   |     ✔      |        ✔        |       ✔
 *   admin    |  ✔   |     ✔      |        ✔        |
 *   member   |  ✔   |     ✔      |                 |
 *   viewer   |  ✔   |            |                 |
 *
 *   * manage = rename/archive the project, change columns, labels and members
 */
import type { ID, MemberRole, Project } from "./types";

/** The role a person has in a project, or `null` if they are not in it. */
export function getMemberRole(project: Project, memberId: ID): MemberRole | null {
  return project.members.find((m) => m.memberId === memberId)?.role ?? null;
}

export function canEditTasks(role: MemberRole | null): boolean {
  return role === "owner" || role === "admin" || role === "member";
}

export function canManageProject(role: MemberRole | null): boolean {
  return role === "owner" || role === "admin";
}

export function canDeleteProject(role: MemberRole | null): boolean {
  return role === "owner";
}

/** Business rule: every project must always keep at least one owner. */
export function countOwners(project: Project): number {
  return project.members.filter((m) => m.role === "owner").length;
}
