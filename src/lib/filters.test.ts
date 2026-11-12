import { describe, expect, it } from "vitest";
import { byId, makeTask } from "@/test/factories";
import {
  countActiveFilters,
  NO_FILTERS,
  parseBoardParams,
  resolveDropIndex,
  sortTaskIds,
  taskMatches,
  toBoardParams,
  type BoardFilters,
} from "./filters";

const today = "2026-06-10";
const ctx = { isDone: false, today, currentUserId: "me" };
const filter = (patch: Partial<BoardFilters>): BoardFilters => ({ ...NO_FILTERS, ...patch });

describe("filters in the web address", () => {
  it("writes only the filters that are switched on", () => {
    const params = toBoardParams(filter({ query: "login", priority: "high" }), "due");
    expect(params.toString()).toBe("q=login&priority=high&sort=due");
    expect(toBoardParams(NO_FILTERS, "manual").toString()).toBe("");
  });

  it("reads them back the same way", () => {
    const original = filter({ query: "x", labelId: "lbl", due: "overdue", assignee: "me" });
    const parsed = parseBoardParams(toBoardParams(original, "newest"));
    expect(parsed).toEqual({ filters: original, sort: "newest" });
  });

  it("ignores values it does not know", () => {
    const parsed = parseBoardParams(new URLSearchParams("priority=huge&due=later&sort=random"));
    expect(parsed).toEqual({ filters: NO_FILTERS, sort: "manual" });
  });

  it("counts the active filters", () => {
    expect(countActiveFilters(NO_FILTERS)).toBe(0);
    expect(countActiveFilters(filter({ query: "  ", priority: "low", due: "none" }))).toBe(2);
  });
});

describe("taskMatches", () => {
  const task = makeTask({
    title: "Fix login bug",
    description: "Happens on Safari",
    priority: "high",
    labelIds: ["bug"],
    assigneeId: "me",
    dueDate: "2026-06-08",
  });

  it("searches the title and description, ignoring case", () => {
    expect(taskMatches(task, filter({ query: "LOGIN" }), ctx)).toBe(true);
    expect(taskMatches(task, filter({ query: "safari" }), ctx)).toBe(true);
    expect(taskMatches(task, filter({ query: "chrome" }), ctx)).toBe(false);
  });

  it("filters by priority and label", () => {
    expect(taskMatches(task, filter({ priority: "high" }), ctx)).toBe(true);
    expect(taskMatches(task, filter({ priority: "low" }), ctx)).toBe(false);
    expect(taskMatches(task, filter({ labelId: "bug" }), ctx)).toBe(true);
    expect(taskMatches(task, filter({ labelId: "docs" }), ctx)).toBe(false);
  });

  it("filters by due date, and a done task is never overdue", () => {
    expect(taskMatches(task, filter({ due: "overdue" }), ctx)).toBe(true);
    expect(taskMatches(task, filter({ due: "overdue" }), { ...ctx, isDone: true })).toBe(false);
    expect(taskMatches(task, filter({ due: "none" }), ctx)).toBe(false);
    expect(taskMatches(makeTask(), filter({ due: "none" }), ctx)).toBe(true);
    const soon = makeTask({ dueDate: "2026-06-11" });
    expect(taskMatches(soon, filter({ due: "soon" }), ctx)).toBe(true);
  });

  it("filters by who it is assigned to", () => {
    expect(taskMatches(task, filter({ assignee: "me" }), ctx)).toBe(true);
    expect(taskMatches(task, filter({ assignee: "unassigned" }), ctx)).toBe(false);
    expect(taskMatches(makeTask(), filter({ assignee: "unassigned" }), ctx)).toBe(true);
  });
});

describe("sortTaskIds", () => {
  const tasks = byId([
    makeTask({ id: "a", title: "Banana", priority: "low", dueDate: null, createdAt: "2026-01-01" }),
    makeTask({ id: "b", title: "apple", priority: "urgent", dueDate: "2026-03-01", createdAt: "2026-01-03" }),
    makeTask({ id: "c", title: "Cherry", priority: "low", dueDate: "2026-02-01", createdAt: "2026-01-02" }),
  ]);
  const order = ["a", "b", "c"];

  it("keeps my own order for 'manual'", () => {
    expect(sortTaskIds(order, tasks, "manual")).toEqual(["a", "b", "c"]);
  });

  it("sorts by priority, and ties keep their order", () => {
    expect(sortTaskIds(order, tasks, "priority")).toEqual(["b", "a", "c"]);
  });

  it("sorts by due date with no date last", () => {
    expect(sortTaskIds(order, tasks, "due")).toEqual(["c", "b", "a"]);
  });

  it("sorts by title A–Z and by newest first", () => {
    expect(sortTaskIds(order, tasks, "title")).toEqual(["b", "a", "c"]);
    expect(sortTaskIds(order, tasks, "newest")).toEqual(["b", "c", "a"]);
  });
});

describe("resolveDropIndex (dropping while some cards are hidden)", () => {
  // Full list: a h1 b h2 c   (h1, h2 are hidden by a filter)
  const full = ["a", "h1", "b", "h2", "c"];

  it("drops just above the visible card that is now below it", () => {
    // Moving c up between a and b on screen.
    expect(resolveDropIndex(full, ["a", "c", "b"], "c")).toBe(2); // a h1 [c] b h2
  });

  it("drops at the bottom when it is last on screen", () => {
    expect(resolveDropIndex(full, ["b", "c", "a"], "a")).toBe(4);
  });

  it("works for a card coming from another list", () => {
    expect(resolveDropIndex(["x", "y"], ["new", "x", "y"], "new")).toBe(0);
    expect(resolveDropIndex([], ["new"], "new")).toBe(0);
  });
});
