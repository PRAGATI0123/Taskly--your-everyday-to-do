"use client"; // Error pages must run in the browser.

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { Button } from "@/components/ui";

/**
 * Next.js shows this automatically if something inside the app crashes,
 * instead of a blank white screen. The header stays usable.
 */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PagePlaceholder
      icon={<TriangleAlert className="size-6" />}
      title="Something went wrong"
      description="This part of Taskly hit a problem. Your saved data is safe."
    >
      <Button onClick={() => retry()}>Try again</Button>
    </PagePlaceholder>
  );
}
