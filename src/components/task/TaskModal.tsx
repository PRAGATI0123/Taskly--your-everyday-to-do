"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui";
import { useTask } from "@/store/selectors";
import { TaskDetails } from "./TaskDetails";

/**
 * The task pop-up shown over the board (the intercepted route).
 * Closing it goes "back", which removes /tasks/… from the address.
 */
export function TaskModal({
  params,
}: {
  params: Promise<{ projectId: string; taskId: string }>;
}) {
  const { projectId, taskId } = use(params);
  const router = useRouter();
  const task = useTask(taskId);
  const close = () => router.back();

  return (
    <Modal open onClose={close} title={task?.title ?? "Task"} size="xl" bare>
      <TaskDetails projectId={projectId} taskId={taskId} onClose={close} onDeleted={close} />
    </Modal>
  );
}
