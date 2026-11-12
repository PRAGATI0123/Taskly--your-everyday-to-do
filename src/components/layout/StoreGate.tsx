"use client";

import type { ReactNode } from "react";
import { TriangleAlert, X } from "lucide-react";
import { IconButton } from "@/components/ui";
import { dismissStorageError, useStorageWarning, useStoreReady } from "@/store/startup";
import { PageLoading } from "./PageLoading";

/**
 * Waits until the saved data has been loaded from IndexedDB, then shows the
 * page. Without this, pages would flash "empty" for a moment before the real
 * projects and tasks arrive. If saving or loading went wrong, a warning bar
 * appears above the page.
 */
export function StoreGate({ children }: { children: ReactNode }) {
  const ready = useStoreReady();
  const warning = useStorageWarning();
  if (!ready) return <PageLoading label="Loading your data" />;

  return (
    <>
      {warning && (
        <div
          role="alert"
          className="flex items-start gap-3 border-b border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p className="flex-1">{warning.message}</p>
          {warning.canDismiss && (
            <IconButton
              size="sm"
              icon={<X className="size-4" />}
              label="Close this warning"
              onClick={dismissStorageError}
            />
          )}
        </div>
      )}
      {children}
    </>
  );
}
