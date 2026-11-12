"use client";

import { useEffect, type ReactNode } from "react";
import { startStore } from "@/store/startup";

/**
 * Wraps the whole app. As soon as the page is running in the browser, it
 * opens IndexedDB and loads the saved data into the store.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void startStore();
  }, []);

  return children;
}
