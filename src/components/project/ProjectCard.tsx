"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import { AlarmClock, Archive, ArchiveRestore, ListChecks, Pencil, Trash2 } from "lucide-react";
import { Avatar, Badge, IconButton, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/dates";
import {
  canDeleteProject,
  canManageProject,
  getMemberRole,
} from "@/lib/permissions";
import { getProjectStats } from "@/lib/projects";
import type { ID, MemberRole, Project } from "@/lib/types";
import { useTasklyStore } from "@/store/tasklyStore";

const ROLE_NAMES: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

interface ProjectCardProps {
  project: Project;
  today: string;
  /** Position in the grid, used to make the cards appear one after another. */
  index: number;
  onEdit: (projectId: ID) => void;
  onToggleArchive: (projectId: ID) => void;
  onDelete: (projectId: ID) => void;
}

/** One project on the dashboard: name, progress, numbers, people and buttons. */
export function ProjectCard({
  project,
  today,
  index,
  onEdit,
  onToggleArchive,
  onDelete,
}: ProjectCardProps) {
  const tasks = useTasklyStore((state) => state.tasks);
  const members = useTasklyStore((state) => state.members);
  const currentUserId = useTasklyStore((state) => state.currentUserId);

  // Only recalculated when the project or the tasks change.
  const stats = useMemo(
    () => getProjectStats(project, tasks, today),
    [project, tasks, today],
  );

  const myRole = currentUserId ? getMemberRole(project, currentUserId) : null;
  const href = `/projects/${project.id}/board`;

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` } as CSSProperties}
      className={cn(
        "group relative flex animate-fade-up flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm shadow-primary/5",
        "transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg hover:shadow-primary/10",
        "focus-within:border-accent/60",
        project.archived && "opacity-80",
      )}
    >
      {/* Top: name + my role */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-snug font-semibold">
            {/* "Stretched link": the invisible ::after covers the whole card,
                so clicking anywhere on it opens the board. */}
            <Link
              href={href}
              className="rounded after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {project.name}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted">
            {project.description || "No description yet."}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {myRole && <Badge tone="primary">{ROLE_NAMES[myRole]}</Badge>}
          {project.archived && <Badge>Archived</Badge>}
        </div>
      </div>

      {/* Middle: progress */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium text-muted">
            {stats.done} of {stats.total} tasks done
          </span>
          <span className="font-display text-base font-semibold">{stats.percent}%</span>
        </div>
        <ProgressBar value={stats.percent} label={`${project.name} progress`} />
      </div>

      {/* Numbers */}
      <div className="flex flex-wrap gap-2">
        <Badge icon={<ListChecks className="size-3" aria-hidden="true" />}>
          {stats.total} {stats.total === 1 ? "task" : "tasks"}
        </Badge>
        {stats.overdue > 0 && (
          <Badge tone="danger" icon={<AlarmClock className="size-3" aria-hidden="true" />}>
            {stats.overdue} overdue
          </Badge>
        )}
      </div>

      {/* Bottom: people, last update, buttons. `relative z-10` lifts the
          buttons above the stretched link so they can still be clicked. */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex -space-x-2">
            {project.members.slice(0, 4).map((pm) => {
              const member = members.find((m) => m.id === pm.memberId);
              return member ? (
                <span key={pm.memberId} title={`${member.name} · ${ROLE_NAMES[pm.role]}`}>
                  <Avatar name={member.name} color={member.color} size="xs" />
                </span>
              ) : null;
            })}
          </div>
          <span className="truncate text-xs text-muted">
            Updated {formatRelativeTime(project.updatedAt)}
          </span>
        </div>

        <div className="relative z-10 flex shrink-0 gap-0.5 opacity-100 transition-opacity sm:opacity-60 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          {canManageProject(myRole) && (
            <>
              <IconButton
                size="sm"
                icon={<Pencil className="size-4" />}
                label={`Edit ${project.name}`}
                onClick={() => onEdit(project.id)}
              />
              <IconButton
                size="sm"
                icon={
                  project.archived ? (
                    <ArchiveRestore className="size-4" />
                  ) : (
                    <Archive className="size-4" />
                  )
                }
                label={`${project.archived ? "Restore" : "Archive"} ${project.name}`}
                onClick={() => onToggleArchive(project.id)}
              />
            </>
          )}
          {canDeleteProject(myRole) && (
            <IconButton
              size="sm"
              variant="danger"
              icon={<Trash2 className="size-4" />}
              label={`Delete ${project.name}`}
              onClick={() => onDelete(project.id)}
            />
          )}
        </div>
      </div>
    </article>
  );
}
