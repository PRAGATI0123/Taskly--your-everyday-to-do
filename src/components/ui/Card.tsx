import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** A rounded white box with a soft border and shadow. */
export function Card({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-sm shadow-primary/5",
        className,
      )}
      {...rest}
    />
  );
}
