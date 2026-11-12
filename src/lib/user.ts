/**
 * The one person who uses Taskly in this browser.
 *
 * There is no backend and no login page: the app always belongs to this user.
 * This is the starting name; anyone can change their own name in Settings
 * (it is then saved in their browser).
 */
import type { Member } from "./types";

export const APP_USER: Member = {
  id: "me",
  name: "Pragati Gautam",
  color: "#8b5a3c",
};

export const USER_NAME_MAX_LENGTH = 40;

/** Checks a person's name. Returns an error message, or `null` if it is fine. */
export function validateUserName(name: string): string | null {
  const clean = name.trim();
  if (clean.length === 0) return "Your name can't be empty.";
  if (clean.length > USER_NAME_MAX_LENGTH) {
    return `Your name must be ${USER_NAME_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}
