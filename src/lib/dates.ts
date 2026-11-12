import type { ISODate, ISODateTime } from "./types";

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Turns "2026-11-24" into "24 Nov 2026".
 * The day is read as UTC so it never shifts by one in other time zones.
 */
export function formatDay(date: ISODate): string {
  return dayFormatter.format(new Date(`${date}T00:00:00Z`));
}

/** Today's date on the user's own calendar, e.g. "2026-11-11". */
export function todayISODate(now: Date = new Date()): ISODate {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Is this day before today? Dates like "2026-11-10" sort like words, so a
 * simple text comparison works.
 */
export function isBeforeDay(date: ISODate, today: ISODate): boolean {
  return date < today;
}

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
];

/** Turns a time into friendly words: "just now", "5 minutes ago", "yesterday". */
export function formatRelativeTime(at: ISODateTime, now: Date = new Date()): string {
  const seconds = Math.round((new Date(at).getTime() - now.getTime()) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return relativeFormatter.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
}
