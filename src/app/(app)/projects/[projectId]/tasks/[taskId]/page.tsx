import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/layout/PageLoading";
import { TaskPage as TaskPageContent } from "@/components/task/TaskPage";

export const metadata: Metadata = { title: "Task" };

/**
 * /projects/[projectId]/tasks/[taskId] as a FULL PAGE.
 * You see this when you open the link directly or refresh. Clicking a task on
 * the board shows the pop-up version instead (see the @modal folder) — both
 * use the same <TaskDetails> component.
 */
export default function TaskPage({ params }: PageProps<"/projects/[projectId]/tasks/[taskId]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <TaskPageContent params={params} />
    </Suspense>
  );
}
