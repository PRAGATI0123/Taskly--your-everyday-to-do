import type { ISODateTime } from "./types";

/** Makes a new unique id, e.g. "3f9c1a2e-7b1d-4c55-9a51-0d2f1c6b8e90". */
export function createId(): string {
  return crypto.randomUUID();
}

/** The current date and time as text. */
export function nowISO(): ISODateTime {
  return new Date().toISOString();
}
