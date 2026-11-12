import { describe, expect, it } from "vitest";
import { byId, makeColumns, makeTask } from "@/test/factories";
import { canDeleteProject, canEditTasks, canManageProject, getMemberRole } from "./permissions";
import {
  buildProject,
  DEFAULT_COLUMN_TITLES,
  getProjectStats,
  validateLabelName,
  validateProjectName,
} from "./projects";

describe("buildProject", () => {
  const project = buildProject(
    { name: "  Launch  ", description: " Ship it ", ownerId: "me" },
    "2026-06-10T00:00:00.000Z",
  );

  it("starts with the default lists and labels, and the creator as owner", () => {
    expect(project.name).toBe("Launch");
    expect(project.description).toBe("Ship it");
    expect(project.columns.map((c) => c.title)).toEqual(DEFAULT_COLUMN_TITLES);
    expect(project.labels.map((l) => l.name)).toEqual(["Bug", "Feature", "Design", "Docs"]);
    expect(getMemberRole(project, "me")).toBe("owner");
  });
});

describe("validators", () => {
  it("checks project names", () => {
    expect(validateProjectName(" ")).toMatch(/empty/);
    expect(validateProjectName("x".repeat(61))).toMatch(/60 characters/);
    expect(validateProjectName("Website")).toBeNull();
  });

  it("does not allow two labels with the same name", () => {
    const labels = [{ id: "1", name: "Bug", color: "#000" }];
    expect(validateLabelName("bug", labels)).toMatch(/already exists/);
    expect(validateLabelName("BUG", labels, "1")).toBeNull(); // renaming itself
    expect(validateLabelName("Idea", labels)).toBeNull();
  });
});

describe("getProjectStats", () => {
  it("counts progress and overdue tasks, never counting done tasks as overdue", () => {
    const project = {
      ...buildProject({ name: "P", description: "", ownerId: "me" }, "2026-06-10"),
      columns: makeColumns({ todo: ["late", "fine"], done: ["oldDone"] }),
    };
    const tasks = byId([
      makeTask({ id: "late", dueDate: "2026-06-01" }),
      makeTask({ id: "fine", dueDate: "2026-07-01" }),
      makeTask({ id: "oldDone", dueDate: "2026-01-01" }),
    ]);
    expect(getProjectStats(project, tasks, "2026-06-10")).toEqual({
      done: 1,
      total: 3,
      percent: 33,
      overdue: 1,
    });
  });
});

describe("permissions", () => {
  it("follows the role table", () => {
    expect([canEditTasks("viewer"), canEditTasks("member")]).toEqual([false, true]);
    expect([canManageProject("member"), canManageProject("admin")]).toEqual([false, true]);
    expect([canDeleteProject("admin"), canDeleteProject("owner")]).toEqual([false, true]);
    expect(canEditTasks(null)).toBe(false);
  });
});
