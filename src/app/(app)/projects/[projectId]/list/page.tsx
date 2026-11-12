import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/layout/PageLoading";
import { TaskTable } from "@/components/list/TaskTable";

export const metadata: Metadata = { title: "List" };

/** /projects/[projectId]/list — the same tasks as the board, as a sortable table. */
export default function ListPage({ params }: PageProps<"/projects/[projectId]/list">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <TaskTable params={params} />
    </Suspense>
  );
}
