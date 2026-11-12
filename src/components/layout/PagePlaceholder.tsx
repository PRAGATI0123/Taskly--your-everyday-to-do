import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PagePlaceholderProps {
  icon?: ReactNode;
  title: string;
  description: string;
  /** Links or buttons to move around while the page is still being built. */
  children?: ReactNode;
  className?: string;
}

/** A simple "this page is coming soon" block, used while we build each page. */
export function PagePlaceholder({
  icon,
  title,
  description,
  children,
  className,
}: PagePlaceholderProps) {
  return (
    <section
      className={cn(
        "flex animate-fade-up flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <p className="max-w-md text-sm text-muted">{description}</p>
      {children && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div>
      )}
    </section>
  );
}

/** A link that looks like our secondary button. */
export const linkButtonClass =
  "inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium shadow-sm transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
