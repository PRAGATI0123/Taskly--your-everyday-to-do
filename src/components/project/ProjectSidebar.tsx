"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LayoutGrid, Plus } from "lucide-react";
import { IconButton } from "@/components/ui";
import { getProjectProgress } from "@/lib/board";
import { cn } from "@/lib/cn";
import type { Project } from "@/lib/types";
import { useTasklyStore } from "@/store/tasklyStore";
import { ProjectFormModal, type ProjectFormValues } from "./ProjectFormModal";

/**
 * Trello-style sidebar next to the board: every project, the current one
 * highlighted, and a "+" button to add a new project without leaving the board.
 */
export function ProjectSidebar({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const projects = useTasklyStore((state) => state.projects);
  const createProject = useTasklyStore((state) => state.createProject);
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Alphabetical, so the list doesn't jump around while you work.
  const { active, archived } = useMemo(() => {
    const sorted = Object.values(projects).sort((a, b) => a.name.localeCompare(b.name));
    return {
      active: sorted.filter((p) => !p.archived),
      archived: sorted.filter((p) => p.archived),
    };
  }, [projects]);

  function handleCreate(values: ProjectFormValues): string | null {
    const result = createProject(values);
    if (!result.ok) return result.error;
    setCreating(false);
    router.push(`/projects/${result.value}/board`);
    return null;
  }

  return (
    <aside
      aria-label="Your projects"
      className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border/70 bg-surface/40 p-3 backdrop-blur lg:flex"
    >
      <Link
        href="/projects"
        className="mb-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        <LayoutGrid className="size-4" aria-hidden="true" />
        All projects
      </Link>

      <div className="flex items-center justify-between px-2">
        <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">
          Your projects
        </h2>
        <IconButton
          size="sm"
          icon={<Plus className="size-4" />}
          label="Add a project"
          onClick={() => setCreating(true)}
        />
      </div>

      <nav className="flex flex-col gap-0.5">
        {active.map((project) => (
          <SidebarItem key={project.id} project={project} current={project.id === projectId} />
        ))}
        {active.length === 0 && (
          <p className="px-2 py-1 text-xs text-muted">No active projects.</p>
        )}
      </nav>

      {archived.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            aria-expanded={showArchived}
            onClick={() => setShowArchived((shown) => !shown)}
            className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold tracking-wide text-muted uppercase hover:text-foreground"
          >
            Archived ({archived.length})
            <ChevronDown
              className={cn("size-4 transition-transform", showArchived && "rotate-180")}
              aria-hidden="true"
            />
          </button>
          {showArchived && (
            <nav className="mt-1 flex flex-col gap-0.5">
              {archived.map((project) => (
                <SidebarItem key={project.id} project={project} current={project.id === projectId} />
              ))}
            </nav>
          )}
        </div>
      )}

      <ProjectFormModal open={creating} onClose={() => setCreating(false)} onSubmit={handleCreate} />
    </aside>
  );
}

function SidebarItem({ project, current }: { project: Project; current: boolean }) {
  const { percent } = getProjectProgress(project);
  return (
    <Link
      href={`/projects/${project.id}/board`}
      aria-current={current ? "page" : undefined}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
        "focus-visible:outline-2 focus-visible:outline-primary",
        current
          ? "bg-primary/12 font-semibold text-foreground"
          : "text-muted hover:bg-surface-muted hover:text-foreground",
      )}
    >
      {/* A little coloured tile with the project's first letter */}
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-gradient text-[11px] font-bold text-on-gradient"
      >
        {project.name.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1 truncate">{project.name}</span>
      <span className="text-[11px] text-muted tabular-nums">{percent}%</span>
    </Link>
  );
}

/** Empty grey shape shown for a split second while the sidebar gets ready. */
export function ProjectSidebarFallback() {
  return (
    <div
      aria-hidden="true"
      className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 border-r border-border/70 bg-surface/40 lg:block"
    />
  );
}
