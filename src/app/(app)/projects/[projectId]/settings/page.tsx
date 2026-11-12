import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/layout/PageLoading";
import { ProjectSettings } from "@/components/project/settings/ProjectSettings";

export const metadata: Metadata = { title: "Project settings" };

/** /projects/[projectId]/settings — name, labels, members, archive/delete. */
export default function ProjectSettingsPage({
  params,
}: PageProps<"/projects/[projectId]/settings">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <ProjectSettings params={params} />
    </Suspense>
  );
}
