/**
 * Small hooks that read ONE thing from the store.
 * A component using one of these only redraws when that one thing changes.
 *
 * Important rule for Zustand: a selector must return something that already
 * exists in the store (or a plain value like a string). If it builds a brand-new
 * array or object every time, React thinks the data changed on every check and
 * redraws forever.
 */
import { getMemberRole } from "@/lib/permissions";
import type { ID, Member, MemberRole, Project, Task } from "@/lib/types";
import { useTasklyStore } from "./tasklyStore";

/** The person who is logged in, or `null`. */
export function useCurrentUser(): Member | null {
  return useTasklyStore(
    (state) => state.members.find((m) => m.id === state.currentUserId) ?? null,
  );
}

/** One project by id, or `undefined` if it doesn't exist. */
export function useProject(projectId: ID): Project | undefined {
  return useTasklyStore((state) => state.projects[projectId]);
}

/** One task by id, or `undefined` if it doesn't exist. */
export function useTask(taskId: ID): Task | undefined {
  return useTasklyStore((state) => state.tasks[taskId]);
}

/** My role in a project, or `null` if I'm not in it / not logged in. */
export function useMyRole(projectId: ID): MemberRole | null {
  return useTasklyStore((state) => {
    const project = state.projects[projectId];
    if (!project || !state.currentUserId) return null;
    return getMemberRole(project, state.currentUserId);
  });
}
