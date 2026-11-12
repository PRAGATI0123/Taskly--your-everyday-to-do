/**
 * The memory box: connects our store to the browser's IndexedDB database.
 *
 * Zustand's `persist` helper knows how to save and load, but not WHERE.
 * This adapter tells it: "use IndexedDB" (through the tiny idb-keyval library,
 * which turns IndexedDB into a simple get / set / delete box).
 *
 * It also does two safety jobs:
 *  - tells OTHER open tabs "I just saved", so they reload the newest data
 *    instead of overwriting it with their old copy;
 *  - can be switched off ("locked") when the saved data could not be read,
 *    so the app never writes over data it failed to open.
 */
import { del, get, set } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";

/** The name our data is saved under inside IndexedDB. */
export const STORAGE_KEY = "taskly-data";

/** The radio channel every Taskly tab listens on. */
const CHANNEL_NAME = "taskly-sync";

interface SaveListener {
  /** Called when saving failed (e.g. storage is full or blocked). */
  onSaveError: (error: unknown) => void;
}

let locked = false;
let listener: SaveListener | null = null;
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null; // e.g. on the server
  channel ??= new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

/** Stops all saving, so data we could not read is never overwritten. */
export function lockStorage(): void {
  locked = true;
}

/** Lets the app hear about failed saves (to show a warning). */
export function setSaveListener(next: SaveListener | null): void {
  listener = next;
}

/** Runs `onChange` whenever another tab saves. Returns a "stop listening" function. */
export function listenToOtherTabs(onChange: () => void): () => void {
  const radio = getChannel();
  if (!radio) return () => {};
  const handle = () => onChange();
  radio.addEventListener("message", handle);
  return () => radio.removeEventListener("message", handle);
}

/** Reads the saved data and checks it is valid JSON. Throws if it can't. */
export async function readSavedData(): Promise<unknown> {
  const raw = await get<string>(STORAGE_KEY);
  return raw === undefined ? undefined : JSON.parse(raw);
}

export const indexedDBStorage: StateStorage = {
  getItem: async (name) => {
    return (await get<string>(name)) ?? null;
  },
  setItem: async (name, value) => {
    if (locked) return;
    try {
      await set(name, value);
      // A BroadcastChannel never delivers a message back to the tab that sent it.
      getChannel()?.postMessage("saved");
    } catch (error) {
      // Saving failed. The app keeps working in memory; we warn instead of crashing.
      console.error("Taskly could not save your changes:", error);
      listener?.onSaveError(error);
    }
  },
  removeItem: async (name) => {
    if (locked) return;
    await del(name);
  },
};
