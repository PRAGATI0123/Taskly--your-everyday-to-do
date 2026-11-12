"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  NO_FILTERS,
  parseBoardParams,
  toBoardParams,
  type BoardFilters,
  type SortOrder,
} from "@/lib/filters";

/**
 * The board's filters and sort, stored in the web address (?q=…&sort=…).
 * Why the address? A refresh keeps them, Back/Forward work, and you can
 * share a link to "all my overdue cards".
 */
export function useBoardFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { filters, sort } = useMemo(
    () => parseBoardParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  // replaceState changes the address WITHOUT reloading the page or asking the
  // server; Next.js still updates useSearchParams for us.
  const write = useCallback(
    (nextFilters: BoardFilters, nextSort: SortOrder) => {
      const query = toBoardParams(nextFilters, nextSort).toString();
      window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
    },
    [pathname],
  );

  return {
    filters,
    sort,
    setFilter: (patch: Partial<BoardFilters>) => write({ ...filters, ...patch }, sort),
    setSort: (nextSort: SortOrder) => write(filters, nextSort),
    clearFilters: () => write(NO_FILTERS, sort),
  };
}
