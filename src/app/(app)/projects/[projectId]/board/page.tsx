import type { Metadata } from "next";
import { Suspense } from "react";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { PageLoading } from "@/components/layout/PageLoading";

export const metadata: Metadata = { title: "Board" };

/** /projects/[projectId]/board — the Kanban board (the main feature). */
export default function BoardPage({ params }: PageProps<"/projects/[projectId]/board">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <KanbanBoard params={params} />
    </Suspense>
  );
}
