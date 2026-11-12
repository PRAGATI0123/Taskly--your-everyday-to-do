/**
 * Joins CSS class names, skipping empty ones.
 *   cn("a", false && "b", undefined, "c")  ->  "a c"
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
