import { cn } from "@/lib/cn";

interface ProgressBarProps {
  /** 0 to 100. */
  value: number;
  /** What the bar measures, read out by screen readers. */
  label: string;
  className?: string;
}

/** A rounded bar that fills up with the brand gradient. */
export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-muted", className)}
    >
      <div
        className="h-full rounded-full bg-brand-gradient transition-[width] duration-700 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
