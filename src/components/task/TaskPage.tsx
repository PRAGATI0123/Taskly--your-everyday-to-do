"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui";
import { TaskDetails } from "./TaskDetails";

/** The task as a FULL PAGE (opened from a link or after a refresh). */
export function TaskPage({
  params,
}: {
  params: Promise<{ projectId: string; taskId: string }>;
}) {
  const { projectId, taskId } = use(params);
  const router = useRouter();
  const boardHref = `/projects/${projectId}/board`;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
      <Link
        href={boardHref}
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to the board
      </Link>
      <Card className="animate-fade-up overflow-hidden">
        <TaskDetails
          projectId={projectId}
          taskId={taskId}
          onDeleted={() => router.push(boardHref)}
        />
      </Card>
    </div>
  );
}
