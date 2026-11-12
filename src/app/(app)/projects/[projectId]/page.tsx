import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageLoading } from "@/components/layout/PageLoading";

/** /projects/abc has no page of its own: send people to /projects/abc/board. */
export default function ProjectPage({ params }: PageProps<"/projects/[projectId]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <RedirectToBoard params={params} />
    </Suspense>
  );
}

async function RedirectToBoard({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<null> {
  const { projectId } = await params;
  // `redirect` stops here and sends the browser to the board.
  redirect(`/projects/${projectId}/board`);
}
