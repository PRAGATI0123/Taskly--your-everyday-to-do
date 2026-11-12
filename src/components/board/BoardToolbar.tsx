"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FilterX, Search, X } from "lucide-react";
import { Button, IconButton, Input, Select } from "@/components/ui";
import { countActiveFilters, type BoardFilters, type SortOrder } from "@/lib/filters";
import type { Label } from "@/lib/types";

interface BoardToolbarProps {
  filters: BoardFilters;
  sort: SortOrder;
  labels: Label[];
  shownCount: number;
  totalCount: number;
  onFilterChange: (patch: Partial<BoardFilters>) => void;
  onSortChange: (sort: SortOrder) => void;
  onClear: () => void;
  /** The List view has its own sort control, so it hides the board's one… */
  showSort?: boolean;
  /** …and puts its own control here instead (shown where the Sort box was). */
  sortControl?: ReactNode;
}

const selectClass = "h-9 text-xs sm:text-sm";

/** Search box, filters and sort above the board. */
export function BoardToolbar({
  filters,
  sort,
  labels,
  shownCount,
  totalCount,
  onFilterChange,
  onSortChange,
  onClear,
  showSort = true,
  sortControl,
}: BoardToolbarProps) {
  // The search box keeps its own copy of the text, so typing always feels
  // instant; every change is also written into the address.
  const [query, setQuery] = useState(filters.query);
  // If the address changes some other way (Back button, coming back to the
  // page), copy the new search text into the box so the two always agree.
  const [lastAddressQuery, setLastAddressQuery] = useState(filters.query);
  if (filters.query !== lastAddressQuery) {
    setLastAddressQuery(filters.query);
    setQuery(filters.query);
  }
  const searchRef = useRef<HTMLInputElement>(null);
  const activeCount = countActiveFilters(filters);

  // Shortcut: press "/" anywhere on the board to jump to the search box.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const typing =
        target instanceof Element &&
        target.closest("input, textarea, select, [contenteditable=true]");
      if (event.key === "/" && !typing && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function changeQuery(value: string) {
    setQuery(value);
    onFilterChange({ query: value });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          ref={searchRef}
          type="search"
          aria-label="Search cards"
          placeholder="Search cards…  ( / )"
          leading={<Search />}
          value={query}
          onChange={(event) => changeQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && query) {
              event.preventDefault();
              changeQuery("");
            }
          }}
          trailing={
            query ? (
              <IconButton
                size="sm"
                icon={<X className="size-4" />}
                label="Clear search"
                onClick={() => changeQuery("")}
              />
            ) : undefined
          }
          className="h-9 w-56 sm:w-64"
        />

        <div className="w-36">
          <Select
            aria-label="Filter by priority"
            className={selectClass}
            value={filters.priority}
            onChange={(e) => onFilterChange({ priority: e.target.value as BoardFilters["priority"] })}
            options={[
              { value: "all", label: "Any priority" },
              { value: "urgent", label: "Urgent" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
          />
        </div>

        <div className="w-36">
          <Select
            aria-label="Filter by label"
            className={selectClass}
            value={filters.labelId}
            onChange={(e) => onFilterChange({ labelId: e.target.value })}
            options={[
              { value: "all", label: "Any label" },
              ...labels.map((label) => ({ value: label.id, label: label.name })),
            ]}
          />
        </div>

        <div className="w-36">
          <Select
            aria-label="Filter by due date"
            className={selectClass}
            value={filters.due}
            onChange={(e) => onFilterChange({ due: e.target.value as BoardFilters["due"] })}
            options={[
              { value: "all", label: "Any due date" },
              { value: "overdue", label: "Overdue" },
              { value: "soon", label: "Due soon" },
              { value: "none", label: "No due date" },
            ]}
          />
        </div>

        <div className="w-36">
          <Select
            aria-label="Filter by person"
            className={selectClass}
            value={filters.assignee}
            onChange={(e) =>
              onFilterChange({ assignee: e.target.value as BoardFilters["assignee"] })
            }
            options={[
              { value: "all", label: "Anyone" },
              { value: "me", label: "Assigned to me" },
              { value: "unassigned", label: "Unassigned" },
            ]}
          />
        </div>

        <div className={showSort ? "w-44" : "hidden"}>
          <Select
            aria-label="Sort cards"
            className={selectClass}
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOrder)}
            options={[
              { value: "manual", label: "Sort: My order" },
              { value: "priority", label: "Sort: Priority" },
              { value: "due", label: "Sort: Due date" },
              { value: "title", label: "Sort: Title A–Z" },
              { value: "newest", label: "Sort: Newest first" },
            ]}
          />
        </div>

        {sortControl}

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            icon={<FilterX className="size-4" />}
            onClick={() => {
              setQuery("");
              onClear();
            }}
          >
            Clear filters ({activeCount})
          </Button>
        )}
      </div>

      {/* Read out by screen readers whenever the number of cards changes. */}
      <p aria-live="polite" className="text-xs text-muted">
        {activeCount > 0
          ? `Showing ${shownCount} of ${totalCount} cards`
          : `${totalCount} ${totalCount === 1 ? "card" : "cards"}`}
        {showSort && sort !== "manual" && " · sorted, so dragging only moves cards between lists"}
      </p>
    </div>
  );
}
