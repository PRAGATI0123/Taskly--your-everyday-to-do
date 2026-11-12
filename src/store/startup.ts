/**
 * Starting the app's memory when the page opens in the browser:
 *  1. Check that the saved data can be read at all.
 *  2. Load it from IndexedDB into the store.
 *     (A first-time visitor has nothing saved, so they start with no projects.)
 *  3. Keep listening: when another tab saves, reload the newest data here too.
 *
 * While this happens the status is "loading"; pages can show a spinner.
 */
import { create } from "zustand";
import {
  listenToOtherTabs,
  lockStorage,
  readSavedData,
  setSaveListener,
} from "./storage";
import { useTasklyStore } from "./tasklyStore";

export type StorageStatus = "loading" | "ready" | "error";

interface StartupState {
  status: StorageStatus;
  /** A friendly message to show when something went wrong with saving. */
  error: string | null;
}

/** A tiny separate store that only knows whether the data is ready. */
export const useStartupStore = create<StartupState>()(() => ({
  status: "loading",
  error: null,
}));

const LOAD_FAILED =
  "Taskly couldn't open your saved data in this browser. To keep it safe, nothing you change now will be saved.";
const SAVE_FAILED =
  "Your last change couldn't be saved (the browser may be out of space or blocking storage).";

let starting: Promise<void> | null = null;

/** Loads the saved data. Safe to call many times — runs once. */
export function startStore(): Promise<void> {
  starting ??= (async () => {
    try {
      // Zustand's own loading hides errors, so check the data ourselves first.
      await readSavedData();
    } catch (error) {
      console.error("Taskly could not open its saved data:", error);
      lockStorage(); // never overwrite data we could not read
      useStartupStore.setState({ status: "error", error: LOAD_FAILED });
      return;
    }

    await useTasklyStore.persist.rehydrate();
    setSaveListener({
      onSaveError: () => useStartupStore.setState({ error: SAVE_FAILED }),
    });
    // Another tab saved? Load its newest data, so neither tab overwrites the other.
    listenToOtherTabs(() => void useTasklyStore.persist.rehydrate());
    useStartupStore.setState({ status: "ready", error: null });
  })();
  return starting;
}

/** Deletes every project and task, leaving a fresh, empty app. */
export function deleteAllData(): void {
  useTasklyStore.getState().loadData({
    members: useTasklyStore.getState().members,
    projects: {},
    tasks: {},
  });
}

/**
 * Hides a "couldn't save" warning once it has been read. The "couldn't open
 * your data" warning stays, because saving stays switched off.
 */
export function dismissStorageError(): void {
  useStartupStore.setState((state) => (state.status === "error" ? state : { error: null }));
}

/** `true` once the data is loaded (or failed to load). */
export function useStoreReady(): boolean {
  return useStartupStore((state) => state.status !== "loading");
}

/** The warning to show (and whether it can be closed), or `null`. */
export function useStorageWarning(): { message: string; canDismiss: boolean } | null {
  const error = useStartupStore((state) => state.error);
  const status = useStartupStore((state) => state.status);
  return error ? { message: error, canDismiss: status !== "error" } : null;
}
