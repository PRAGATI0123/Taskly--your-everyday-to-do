import { Suspense } from "react";
import { ProjectHeader, ProjectHeaderFallback } from "@/components/project/ProjectHeader";
import { ProjectSidebar, ProjectSidebarFallback } from "@/components/project/ProjectSidebar";

/**
 * Shared frame for every page of one project, Trello style:
 *   [ projects sidebar | project name + tabs + the page ]
 *
 * `[projectId]` is a DYNAMIC segment: one folder serves every project.
 * `modal` is a PARALLEL ROUTE slot (the "@modal" folder) for the task pop-up.
 * The project id is only known per visit, so those parts wait in Suspense.
 */
export default function ProjectLayout({
  children,
  modal,
  params,
}: LayoutProps<"/projects/[projectId]">) {
  return (
    <div className="flex min-h-0 flex-1">
      <Suspense fallback={<ProjectSidebarFallback />}>
        <ProjectSidebar params={params} />
      </Suspense>

      <div className="flex min-w-0 flex-1 flex-col px-4 py-5 lg:px-6">
        <Suspense fallback={<ProjectHeaderFallback />}>
          <ProjectHeader params={params} />
        </Suspense>
        {children}
      </div>

      {modal}
    </div>
  );
}
