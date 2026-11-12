import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { linkButtonClass, PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = { title: "Page not found" };

/** Shown for any address that doesn't exist (a "404"). */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <PagePlaceholder
        icon={<Compass className="size-6" />}
        title="Page not found"
        description="This page doesn't exist. It may have been moved or deleted."
      >
        <Link href="/" className={linkButtonClass}>
          Go home
        </Link>
        <Link href="/projects" className={linkButtonClass}>
          My projects
        </Link>
      </PagePlaceholder>
    </main>
  );
}
