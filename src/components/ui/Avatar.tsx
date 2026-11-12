import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  /** Background colour of the circle, e.g. "#a86b40". */
  color: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  xs: "size-5 text-[9px]",
  sm: "size-7 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-12 text-base",
};

/** "Riya Sharma" -> "RS", "Demo" -> "D" */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

/** A coloured circle with a person's initials. Hover to see the full name. */
export function Avatar({ name, color, size = "md", className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      style={{ backgroundColor: color }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-surface select-none",
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
