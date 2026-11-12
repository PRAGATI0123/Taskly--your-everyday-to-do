import { describe, expect, it } from "vitest";
import { makeColumns } from "@/test/factories";
import {
  addColumn,
  addTaskToColumn,
  canDeleteColumn,
  deleteColumn,
  findColumnOfTask,
  getProjectProgress,
  insertAt,
  isTaskDone,
  moveColumn,
  moveItem,
  moveTask,
  renameColumn,
  validateColumnTitle,
} from "./board";

/** Just the task ids of each column, e.g. { todo: ["a"], done: [] }. */
function ids(columns: ReturnType<typeof makeColumns>) {
  return Object.fromEntries(columns.map((c) => [c.id, c.taskIds]));
}

describe("list helpers", () => {
  it("insertAt puts an item at a position and keeps the original list", () => {
    const list = ["a", "b"];
    expect(insertAt(list, 1, "x")).toEqual(["a", "x", "b"]);
    expect(insertAt(list, 99, "x")).toEqual(["a", "b", "x"]);
    expect(insertAt(list, -5, "x")).toEqual(["x", "a", "b"]);
    expect(list).toEqual(["a", "b"]);
  });

  it("moveItem moves an item and ignores a bad starting index", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(moveItem(["a", "b"], 5, 0)).toEqual(["a", "b"]);
  });
});

describe("moveTask (drag and drop)", () => {
  const columns = makeColumns({ todo: ["a", "b", "c"], doing: ["d"], done: [] });

  it("reorders inside the same column", () => {
    expect(ids(moveTask(columns, "a", "todo", 2))).toEqual({
      todo: ["b", "c", "a"],
      doing: ["d"],
      done: [],
    });
  });

  it("moves a card to another column at the chosen position", () => {
    expect(ids(moveTask(columns, "b", "doing", 0))).toEqual({
      todo: ["a", "c"],
      doing: ["b", "d"],
      done: [],
    });
  });

  it("can drop into an empty column", () => {
    expect(ids(moveTask(columns, "d", "done", 0)).done).toEqual(["d"]);
  });

  it("does nothing for an unknown task or column", () => {
    expect(ids(moveTask(columns, "zzz", "done", 0))).toEqual(ids(columns));
    expect(ids(moveTask(columns, "a", "nowhere", 0))).toEqual(ids(columns));
  });

  it("never changes the columns it was given", () => {
    moveTask(columns, "a", "done", 0);
    expect(columns[0]?.taskIds).toEqual(["a", "b", "c"]);
  });
});

describe("addTaskToColumn", () => {
  it("adds to the bottom by default", () => {
    const columns = makeColumns({ todo: ["a"] });
    expect(addTaskToColumn(columns, "todo", "b")[0]?.taskIds).toEqual(["a", "b"]);
  });

  it("never lets a card appear twice", () => {
    const columns = makeColumns({ todo: ["a"], done: ["b"] });
    const result = ids(addTaskToColumn(columns, "todo", "b", 0));
    expect(result).toEqual({ todo: ["b", "a"], done: [] });
  });
});

describe("done column rules", () => {
  const columns = makeColumns({ todo: ["a"], done: ["b"] });

  it("treats the LAST column as done", () => {
    expect(isTaskDone(columns, "b")).toBe(true);
    expect(isTaskDone(columns, "a")).toBe(false);
    expect(findColumnOfTask(columns, "a")?.id).toBe("todo");
  });

  it("adds a new column just before Done, so Done stays last", () => {
    const result = addColumn(columns, "review", "  Review  ");
    expect(result.map((c) => c.id)).toEqual(["todo", "review", "done"]);
    expect(result[1]?.title).toBe("Review");
  });

  it("works out progress from the done column", () => {
    const project = { columns: makeColumns({ todo: ["a", "b", "c"], done: ["d"] }) };
    expect(getProjectProgress(project)).toEqual({ done: 1, total: 4, percent: 25 });
    expect(getProjectProgress({ columns: [] })).toEqual({ done: 0, total: 0, percent: 0 });
  });
});

describe("column names", () => {
  const columns = makeColumns({ todo: [], done: [] });

  it("rejects empty, too long and duplicate names", () => {
    expect(validateColumnTitle("   ", columns)).toMatch(/empty/);
    expect(validateColumnTitle("x".repeat(41), columns)).toMatch(/40 characters/);
    expect(validateColumnTitle(" DONE ", columns)).toMatch(/already exists/);
    expect(validateColumnTitle("Review", columns)).toBeNull();
  });

  it("lets a column keep its own name when renaming", () => {
    expect(validateColumnTitle("done", columns, "done")).toBeNull();
    expect(renameColumn(columns, "todo", " Backlog ")[0]?.title).toBe("Backlog");
  });

  it("moves a column left or right", () => {
    expect(moveColumn(columns, "todo", 1).map((c) => c.id)).toEqual(["done", "todo"]);
  });
});

describe("deleteColumn", () => {
  const columns = makeColumns({ todo: ["a"], doing: ["b", "c"], done: ["d"] });

  it("can move the cards to another column", () => {
    const result = deleteColumn(columns, "doing", "todo");
    expect(ids(result.columns)).toEqual({ todo: ["a", "b", "c"], done: ["d"] });
    expect(result.deletedTaskIds).toEqual([]);
  });

  it("can delete the cards together with the column", () => {
    const result = deleteColumn(columns, "doing", null);
    expect(result.columns.map((c) => c.id)).toEqual(["todo", "done"]);
    expect(result.deletedTaskIds).toEqual(["b", "c"]);
  });

  it("always keeps at least one column", () => {
    const single = makeColumns({ todo: ["a"] });
    expect(canDeleteColumn(single)).toBe(false);
    expect(deleteColumn(single, "todo", null).columns).toHaveLength(1);
  });
});
