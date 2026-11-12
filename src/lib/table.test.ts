import { describe, expect, it } from "vitest";
import { makeTask } from "@/test/factories";
import { defaultDirection, sortTableRows, type TableRow } from "./table";
import type { Task } from "./types";

/** One table row: table facts (list, assignee…) and task fields mixed together. */
function row(id: string, extra: Partial<Omit<TableRow, "task">> & Partial<Task> = {}): TableRow {
  const { columnIndex = 0, columnTitle = "To Do", assigneeName = "", isDone = false, ...task } = extra;
  return { task: makeTask({ id, ...task }), columnIndex, columnTitle, assigneeName, isDone };
}

const rows = [
  row("a", { title: "Banana", columnIndex: 2, priority: "low", dueDate: null, updatedAt: "2026-01-02" }),
  row("b", { title: "Apple", columnIndex: 0, priority: "urgent", dueDate: "2026-05-01", assigneeName: "Pragati", updatedAt: "2026-01-03" }),
  row("c", { title: "Cherry", columnIndex: 1, priority: "low", dueDate: "2026-04-01", updatedAt: "2026-01-01" }),
];
const order = (sorted: TableRow[]) => sorted.map((r) => r.task.id);

describe("sortTableRows", () => {
  it("sorts by name in both directions", () => {
    expect(order(sortTableRows(rows, "title", "asc"))).toEqual(["b", "a", "c"]);
    expect(order(sortTableRows(rows, "title", "desc"))).toEqual(["c", "a", "b"]);
  });

  it("sorts by board order and by priority (ties keep their order)", () => {
    expect(order(sortTableRows(rows, "list", "asc"))).toEqual(["b", "c", "a"]);
    expect(order(sortTableRows(rows, "priority", "asc"))).toEqual(["b", "a", "c"]);
  });

  it("always puts rows with no due date or no assignee last", () => {
    expect(order(sortTableRows(rows, "due", "asc"))).toEqual(["c", "b", "a"]);
    expect(order(sortTableRows(rows, "due", "desc"))).toEqual(["b", "c", "a"]);
    expect(order(sortTableRows(rows, "assignee", "desc"))[0]).toBe("b");
  });

  it("starts 'Updated' with the newest change first", () => {
    expect(defaultDirection("updated")).toBe("desc");
    expect(defaultDirection("title")).toBe("asc");
    expect(order(sortTableRows(rows, "updated", "desc"))).toEqual(["b", "a", "c"]);
  });

  it("does not change the rows it was given", () => {
    sortTableRows(rows, "title", "asc");
    expect(order(rows)).toEqual(["a", "b", "c"]);
  });
});
