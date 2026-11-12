import type { ReactNode } from "react";

/** A titled block inside the task details (Description, Checklist, …). */
export function Section({
  icon,
  title,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  /** Optional button on the right of the title. */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-muted [&>svg]:size-4" aria-hidden="true">
            {icon}
          </span>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}
