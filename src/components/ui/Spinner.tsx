import { cn } from "@/lib/cn";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  /** What screen readers announce. */
  label?: string;
  className?: string;
}

const sizes = { sm: "size-4", md: "size-6", lg: "size-10" };

/** A spinning circle that means "please wait". */
export function Spinner({ size = "md", label = "Loading", className }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex", className)}>
      <svg viewBox="0 0 24 24" fill="none" className={cn("animate-spin", sizes[size])}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}
