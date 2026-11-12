/**
 * The memory box: connects our store to the browser's IndexedDB database.
 *
 * Zustand's `persist` helper knows how to save and load, but not WHERE.
 * This adapter tells it: "use IndexedDB" (through the tiny idb-keyval library,
 * which turns IndexedDB into a simple get / set / delete box).
 */
import { del, get, set } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";

/** The name our data is saved under inside IndexedDB. */
export const STORAGE_KEY = "taskly-data";

export const indexedDBStorage: StateStorage = {
  getItem: async (name) => {
    return (await get<string>(name)) ?? null;
  },
  setItem: async (name, value) => {
    try {
      await set(name, value);
    } catch (error) {
      // Saving failed (e.g. storage is full or blocked). The app keeps working
      // in memory; we just warn instead of crashing.
      console.error("Taskly could not save your changes:", error);
    }
  },
  removeItem: async (name) => {
    await del(name);
  },
};
