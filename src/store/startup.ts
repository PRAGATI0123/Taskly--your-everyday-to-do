/**
 * Starting the app's memory when the page opens in the browser:
 * load whatever this browser saved before from IndexedDB into the store.
 * A first-time visitor has nothing saved, so they start with no projects.
 *
 * While this happens the status is "loading"; pages can show a spinner.
 */
import { create } from "zustand";
import { emptyState, useTasklyStore } from "./tasklyStore";

export type StorageStatus = "loading" | "ready" | "error";

interface StartupState {
  status: StorageStatus;
  /** A friendly message when status is "error". */
  error: string | null;
}

/** A tiny separate store that only knows whether the data is ready. */
export const useStartupStore = create<StartupState>()(() => ({
  status: "loading",
  error: null,
}));

let starting: Promise<void> | null = null;

/** Loads the saved data. Safe to call many times — runs once. */
export function startStore(): Promise<void> {
  starting ??= (async () => {
    try {
      await useTasklyStore.persist.rehydrate();
      useStartupStore.setState({ status: "ready", error: null });
    } catch (error) {
      console.error("Taskly could not open its saved data:", error);
      // Keep the app usable (starting empty), but remember what went wrong.
      useStartupStore.setState({
        status: "error",
        error:
          "Your browser blocked saving, so changes will be lost when you close this tab.",
      });
    }
  })();
  return starting;
}

/** Deletes every project and task, leaving a fresh, empty app. */
export function deleteAllData(): void {
  useTasklyStore.getState().loadData({
    members: emptyState.members,
    projects: {},
    tasks: {},
  });
}

/** `true` once the data is loaded (or failed to load). */
export function useStoreReady(): boolean {
  return useStartupStore((state) => state.status !== "loading");
}
