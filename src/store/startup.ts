/**
 * Starting the app's memory when the page opens in the browser:
 *   1. Has this browser saved Taskly data before?
 *   2. Load it from IndexedDB into the store.
 *   3. First visit ever? Fill the store with sample data instead.
 *
 * While this happens the status is "loading"; pages can show a spinner.
 */
import { create } from "zustand";
import { createSampleData } from "@/lib/sample-data";
import { hasSavedData } from "./storage";
import { useTasklyStore } from "./tasklyStore";

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

/** Loads saved data (or sample data). Safe to call many times — runs once. */
export function startStore(): Promise<void> {
  starting ??= (async () => {
    try {
      const firstVisit = !(await hasSavedData());
      await useTasklyStore.persist.rehydrate();
      if (firstVisit) {
        useTasklyStore.getState().loadData(createSampleData());
      }
      useStartupStore.setState({ status: "ready", error: null });
    } catch (error) {
      console.error("Taskly could not open its saved data:", error);
      // Keep the app usable with sample data, but tell the user.
      useTasklyStore.getState().loadData(createSampleData());
      useStartupStore.setState({
        status: "error",
        error:
          "Your browser blocked saving, so changes will be lost when you close this tab.",
      });
    }
  })();
  return starting;
}

/** Throws away everything and loads fresh sample data (used by "Reset demo"). */
export function resetToSampleData(): void {
  useTasklyStore.getState().loadData(createSampleData());
}

/** `true` once the data is loaded (or failed to load and we fell back). */
export function useStoreReady(): boolean {
  return useStartupStore((state) => state.status !== "loading");
}
