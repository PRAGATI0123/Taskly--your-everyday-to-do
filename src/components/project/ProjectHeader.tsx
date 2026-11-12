"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useProject } from "@/store/selectors";

const TABS = [
  { segment: "board", label: "Board" },
  { segment: "list", label: "List" },
  // "Project settings" (not just "Settings") so it isn't confused with the
  // app-wide Settings link in the top bar.
  { segment: "settings", label: "Project settings" },
];

/** The project's name plus the Board / List / Settings tabs. */
export function ProjectHeader({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const pathname = usePathname();
  const project = useProject(projectId);

  return (
    <div className="mb-6 flex flex-col gap-4">
      <div>
        <Link href="/projects" className="text-xs font-medium text-muted hover:text-foreground">
          ← All projects
        </Link>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          {project?.name ?? "Project"}
        </h1>
        {/* The project's description, right under its name (max 2 lines; hover
            shows all of it). Changed on the Project settings page. */}
        {project?.description && (
          <p title={project.description} className="mt-1 line-clamp-2 max-w-3xl text-sm text-muted">
            {project.description}
          </p>
        )}
      </div>

      <nav aria-label="Project views" className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const href = `/projects/${projectId}/${tab.segment}`;
          const active = pathname === href;
          return (
            <Link
              key={tab.segment}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 pb-2 text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-primary",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** What shows for a split second before the project id is known. */
export function ProjectHeaderFallback() {
  return (
    <div className="mb-6 flex flex-col gap-4" aria-hidden="true">
      <div className="h-4 w-20 rounded bg-surface-muted" />
      <div className="h-8 w-56 rounded-lg bg-surface-muted" />
      <div className="h-8 border-b border-border" />
    </div>
  );
}
