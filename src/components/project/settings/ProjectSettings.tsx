"use client";

import { use } from "react";
import Link from "next/link";
import { Eye, SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { canManageProject } from "@/lib/permissions";
import { useMyRole, useProject } from "@/store/selectors";
import { DangerZone } from "./DangerZone";
import { GeneralSettings } from "./GeneralSettings";
import { LabelSettings } from "./LabelSettings";
import { MemberSettings } from "./MemberSettings";

/** The Project settings page: General, Labels, Members & roles, Danger zone. */
export function ProjectSettings({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const project = useProject(projectId);
  const role = useMyRole(projectId);

  if (!project) {
    return (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title="Project not found"
        description="It may have been deleted. Pick another project from your list."
        action={
          <Link href="/projects" className="text-sm font-semibold text-primary underline">
            Go to all projects
          </Link>
        }
      />
    );
  }

  const canManage = canManageProject(role);

  return (
    <div className="flex max-w-4xl animate-fade-up flex-col gap-5 pb-10">
      {!canManage && (
        <p className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          <Eye className="size-4" aria-hidden="true" />
          Only owners and admins can change these settings.
        </p>
      )}
      {/* `key`: switching to another project starts the form fresh. */}
      <GeneralSettings key={project.id} project={project} canManage={canManage} />
      <LabelSettings project={project} canManage={canManage} />
      <MemberSettings project={project} />
      <DangerZone project={project} role={role} />
    </div>
  );
}
