import { Suspense } from "react";
import { TaskModal } from "@/components/task/TaskModal";

/**
 * The SAME address as the full task page, but as a pop-up over the board.
 *
 * "(.)tasks" is an INTERCEPTING ROUTE: when you click a task link while
 * already inside the project, Next.js catches ("intercepts") the navigation
 * and shows this pop-up instead of leaving the board. The address bar still
 * changes, so the link can be shared or refreshed (which shows the full page).
 */
export default function TaskModalPage({
  params,
}: PageProps<"/projects/[projectId]/tasks/[taskId]">) {
  return (
    <Suspense fallback={null}>
      <TaskModal params={params} />
    </Suspense>
  );
}
