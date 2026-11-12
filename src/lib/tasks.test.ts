import { describe, expect, it } from "vitest";
import { makeTask } from "@/test/factories";
import { formatDay, formatRelativeTime, isBeforeDay, todayISODate } from "./dates";
import {
  addActivity,
  buildTask,
  describeTaskChanges,
  getDueStatus,
  validateShortText,
  validateTaskTitle,
} from "./tasks";

describe("getDueStatus", () => {
  const today = "2026-06-10";

  it("says overdue, soon or later", () => {
    expect(getDueStatus("2026-06-09", false, today)).toBe("overdue");
    expect(getDueStatus("2026-06-10", false, today)).toBe("soon");
    expect(getDueStatus("2026-06-12", false, today)).toBe("soon");
    expect(getDueStatus("2026-06-13", false, today)).toBe("later");
  });

  it("a finished task is never overdue", () => {
    expect(getDueStatus("2020-01-01", true, today)).toBe("done");
  });
});

describe("dates", () => {
  it("formats a day the same in every time zone", () => {
    expect(formatDay("2026-11-24")).toBe("24 Nov 2026");
  });

  it("compares days and builds today's date", () => {
    expect(isBeforeDay("2026-01-09", "2026-01-10")).toBe(true);
    expect(isBeforeDay("2026-01-10", "2026-01-10")).toBe(false);
    expect(todayISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("describes times in friendly words", () => {
    const now = new Date("2026-06-10T12:00:00Z");
    expect(formatRelativeTime("2026-06-10T11:59:50Z", now)).toBe("just now");
    expect(formatRelativeTime("2026-06-10T11:55:00Z", now)).toBe("5 minutes ago");
    expect(formatRelativeTime("2026-06-09T12:00:00Z", now)).toBe("yesterday");
  });
});

describe("making tasks", () => {
  it("checks titles and short text", () => {
    expect(validateTaskTitle("  ")).toMatch(/empty/);
    expect(validateTaskTitle("x".repeat(121))).toMatch(/120 characters/);
    expect(validateTaskTitle("Write tests")).toBeNull();
    expect(validateShortText("", 10, "Comment")).toBe("Comment can't be empty.");
  });

  it("fills in sensible defaults", () => {
    const task = buildTask("p1", { title: "  New card  " }, "2026-06-10T00:00:00.000Z");
    expect(task).toMatchObject({
      projectId: "p1",
      title: "New card",
      priority: "medium",
      assigneeId: null,
      dueDate: null,
      labelIds: [],
      createdAt: "2026-06-10T00:00:00.000Z",
    });
  });

  it("adds a history line and stamps the update time", () => {
    const task = addActivity(makeTask(), "Did a thing", "me", "2026-06-10T09:00:00.000Z");
    expect(task.activity.map((a) => a.message)).toEqual(["Did a thing"]);
    expect(task.updatedAt).toBe("2026-06-10T09:00:00.000Z");
  });
});

describe("describeTaskChanges (task history)", () => {
  const names = { member: () => "Pragati", label: (id: string) => id.toUpperCase() };
  const before = makeTask({ title: "Old", priority: "low", labelIds: ["bug"] });

  it("describes each real change in plain words", () => {
    const messages = describeTaskChanges(
      before,
      {
        title: "New",
        priority: "high",
        assigneeId: "me",
        dueDate: "2026-11-24",
        labelIds: ["docs"],
      },
      names,
    );
    expect(messages).toEqual([
      'Renamed the task to "New"',
      "Changed priority from Low to High",
      "Assigned this task to Pragati",
      "Set the due date to 24 Nov 2026",
      "Added label DOCS",
      "Removed label BUG",
    ]);
  });

  it("skips fields that did not really change", () => {
    expect(describeTaskChanges(before, { title: " Old ", priority: "low" }, names)).toEqual([]);
  });
});
