"use client";

import type { ReactNode } from "react";
import { useStoreReady } from "@/store/startup";
import { PageLoading } from "./PageLoading";

/**
 * Waits until the saved data has been loaded from IndexedDB, then shows the
 * page. Without this, pages would flash "empty" for a moment before the real
 * projects and tasks arrive.
 */
export function StoreGate({ children }: { children: ReactNode }) {
  const ready = useStoreReady();
  if (!ready) return <PageLoading label="Loading your data" />;
  return children;
}
