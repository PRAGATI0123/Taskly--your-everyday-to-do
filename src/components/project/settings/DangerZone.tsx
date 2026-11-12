"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Button, ConfirmDialog } from "@/components/ui";
import { canDeleteProject, canManageProject } from "@/lib/permissions";
import type { MemberRole, Project } from "@/lib/types";
import { useTasklyStore } from "@/store/tasklyStore";
import { SettingsSection } from "./SettingsSection";

/** Archive / restore and delete — the big, careful buttons. */
export function DangerZone({ project, role }: { project: Project; role: MemberRole | null }) {
  const router = useRouter();
  const setProjectArchived = useTasklyStore((state) => state.setProjectArchived);
  const deleteProject = useTasklyStore((state) => state.deleteProject);
  const taskCount = project.columns.reduce((sum, c) => sum + c.taskIds.length, 0);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function confirmDelete() {
    const result = deleteProject(project.id);
    if (!result.ok) return setError(result.error);
    setConfirming(false);
    router.push("/projects");
  }

  return (
    <SettingsSection
      title="Danger zone"
      description="Big changes. Archiving can be undone; deleting can't."
      danger
    >
      <div className="flex flex-col divide-y divide-border rounded-xl border border-danger/25">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-48 flex-1">
            <p className="text-sm font-semibold">
              {project.archived ? "Restore this project" : "Archive this project"}
            </p>
            <p className="text-xs text-muted">
              {project.archived
                ? "Make the board editable again and show it with your active projects."
                : "Hide it from your active projects and make the board read-only. Nothing is deleted."}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={!canManageProject(role)}
            icon={
              project.archived ? (
                <ArchiveRestore className="size-4" />
              ) : (
                <Archive className="size-4" />
              )
            }
            onClick={() => setProjectArchived(project.id, !project.archived)}
          >
            {project.archived ? "Restore" : "Archive"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-48 flex-1">
            <p className="text-sm font-semibold">Delete this project</p>
            <p className="text-xs text-muted">
              Deletes the project and all {taskCount} of its tasks for good. Only the owner
              can do this.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            disabled={!canDeleteProject(role)}
            icon={<Trash2 className="size-4" />}
            onClick={() => setConfirming(true)}
          >
            Delete project
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Delete project?"
        confirmLabel="Delete project"
        danger
        error={error}
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirming(false);
          setError(null);
        }}
      >
        <p>
          <strong className="text-foreground">{project.name}</strong> and its {taskCount}{" "}
          {taskCount === 1 ? "task" : "tasks"} will be deleted for good. This can&apos;t be undone.
        </p>
        <p>Tip: archive it instead if you might need it later.</p>
      </ConfirmDialog>
    </SettingsSection>
  );
}
