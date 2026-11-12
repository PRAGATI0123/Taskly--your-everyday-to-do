"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, FolderKanban, Plus } from "lucide-react";
import { Button, ConfirmDialog, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import { todayISODate } from "@/lib/dates";
import type { ID } from "@/lib/types";
import { useCurrentUser } from "@/store/selectors";
import { useTasklyStore } from "@/store/tasklyStore";
import { ProjectCard } from "./ProjectCard";
import { ProjectFormModal, type ProjectFormValues } from "./ProjectFormModal";

type View = "active" | "archived";

/**
 * Which pop-up is open right now. Only one can be open at a time, so one
 * piece of state describes it (instead of three separate true/false flags).
 */
type Dialog =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; projectId: ID }
  | { kind: "delete"; projectId: ID; error: string | null };

/** The /projects page: all projects as cards, plus create/edit/archive/delete. */
export function ProjectsDashboard() {
  const router = useRouter();
  const user = useCurrentUser();
  const projects = useTasklyStore((state) => state.projects);
  const tasks = useTasklyStore((state) => state.tasks);
  const { createProject, updateProject, setProjectArchived, deleteProject } =
    useTasklyStore.getState();

  const [view, setView] = useState<View>("active");
  const [dialog, setDialog] = useState<Dialog>({ kind: "none" });
  const today = todayISODate();

  // Split into active / archived and put the most recently changed first.
  const { active, archived } = useMemo(() => {
    const sorted = Object.values(projects).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
    return {
      active: sorted.filter((p) => !p.archived),
      archived: sorted.filter((p) => p.archived),
    };
  }, [projects]);

  const shown = view === "active" ? active : archived;
  const closeDialog = () => setDialog({ kind: "none" });

  const editingProject = dialog.kind === "edit" ? projects[dialog.projectId] : undefined;
  const deletingProject = dialog.kind === "delete" ? projects[dialog.projectId] : undefined;
  const deletingTaskCount = deletingProject
    ? deletingProject.columns.reduce((sum, c) => sum + c.taskIds.length, 0)
    : 0;

  function handleCreate(values: ProjectFormValues): string | null {
    const result = createProject(values);
    if (!result.ok) return result.error;
    closeDialog();
    router.push(`/projects/${result.value}/board`); // go straight to the new board
    return null;
  }

  function handleEdit(values: ProjectFormValues): string | null {
    if (dialog.kind !== "edit") return null;
    const result = updateProject(dialog.projectId, values);
    if (!result.ok) return result.error;
    closeDialog();
    return null;
  }

  function handleToggleArchive(projectId: ID) {
    const project = projects[projectId];
    if (project) setProjectArchived(projectId, !project.archived);
  }

  function handleDelete() {
    if (dialog.kind !== "delete") return;
    const result = deleteProject(dialog.projectId);
    if (!result.ok) setDialog({ ...dialog, error: result.error });
    else closeDialog();
  }

  const firstName = user?.name.split(" ")[0];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* Heading + New project button */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-fade-up">
          <p className="text-sm font-medium text-muted">
            {firstName ? `Hello, ${firstName} 👋` : "Hello 👋"}
          </p>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Your projects</h1>
          <p className="mt-1 text-sm text-muted">
            {active.length} active · {archived.length} archived ·{" "}
            {Object.keys(tasks).length} tasks in total
          </p>
        </div>
        <Button
          icon={<Plus className="size-4" />}
          onClick={() => setDialog({ kind: "create" })}
          className="animate-fade-up [animation-delay:100ms]"
        >
          New project
        </Button>
      </div>

      {/* Active / Archived switch */}
      <div
        role="tablist"
        aria-label="Which projects to show"
        className="inline-flex w-fit gap-1 rounded-xl border border-border bg-surface-muted/60 p-1"
      >
        {(
          [
            ["active", "Active", active.length],
            ["archived", "Archived", archived.length],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={view === value}
            onClick={() => setView(value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              "focus-visible:outline-2 focus-visible:outline-primary",
              view === value
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            {label}
            <span className="rounded-full bg-primary/10 px-1.5 text-xs text-primary">{count}</span>
          </button>
        ))}
      </div>

      {/* The cards (or a friendly message when there are none) */}
      {shown.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              today={today}
              index={index}
              onEdit={(projectId) => setDialog({ kind: "edit", projectId })}
              onToggleArchive={handleToggleArchive}
              onDelete={(projectId) => setDialog({ kind: "delete", projectId, error: null })}
            />
          ))}
        </div>
      ) : view === "active" ? (
        <EmptyState
          icon={<FolderKanban className="size-6" />}
          title="No projects yet"
          description="Create a project to get a Kanban board for planning and tracking its tasks."
          action={
            <Button icon={<Plus className="size-4" />} onClick={() => setDialog({ kind: "create" })}>
              Create your first project
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={<Archive className="size-6" />}
          title="No archived projects"
          description="Finished projects you archive will rest here. You can restore them any time."
        />
      )}

      {/* Pop-ups */}
      <ProjectFormModal
        open={dialog.kind === "create" || dialog.kind === "edit"}
        project={editingProject}
        onClose={closeDialog}
        onSubmit={dialog.kind === "edit" ? handleEdit : handleCreate}
      />
      <ConfirmDialog
        open={dialog.kind === "delete"}
        title="Delete project?"
        confirmLabel="Delete project"
        danger
        error={dialog.kind === "delete" ? dialog.error : null}
        onConfirm={handleDelete}
        onCancel={closeDialog}
      >
        <p>
          <strong className="text-foreground">{deletingProject?.name}</strong> and its{" "}
          {deletingTaskCount} {deletingTaskCount === 1 ? "task" : "tasks"} will be deleted
          for good. This can&apos;t be undone.
        </p>
        <p>Tip: archive it instead if you might need it later.</p>
      </ConfirmDialog>
    </div>
  );
}
