import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";

/** One block on the settings page: a title, a short explanation, and its controls. */
export function SettingsSection({
  title,
  description,
  danger = false,
  children,
}: {
  title: string;
  description: string;
  /** Red border for the "Danger zone". */
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "grid gap-5 p-5 sm:p-6 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8",
        danger && "border-danger/30",
      )}
    >
      <div>
        <h2 className={cn("font-display text-lg font-semibold", danger && "text-danger")}>
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </Card>
  );
}
