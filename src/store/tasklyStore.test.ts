import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_USER } from "@/lib/user";
import { emptyState, useTasklyStore } from "./tasklyStore";

// Tests run outside a browser, so there is no IndexedDB. A simple in-memory
// box stands in for it.
vi.mock("idb-keyval", () => {
  const box = new Map<string, unknown>();
  return {
    get: async (key: string) => box.get(key),
    set: async (key: string, value: unknown) => void box.set(key, value),
    del: async (key: string) => void box.delete(key),
  };
});

const store = () => useTasklyStore.getState();

/** Makes a project and returns its id and its list ids. */
function newProject() {
  const result = store().createProject({ name: "Test project", description: "" });
  if (!result.ok) throw new Error(result.error);
  const project = store().projects[result.value]!;
  const [todo, doing, review, done] = project.columns.map((c) => c.id) as [string, string, string, string];
  return { projectId: project.id, todo, doing, review, done };
}

function newTask(projectId: string, columnId: string, title = "Card") {
  const result = store().createTask(projectId, columnId, { title });
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

const columnsOf = (projectId: string) =>
  store().projects[projectId]!.columns.map((c) => c.taskIds);

beforeEach(() => {
  // Start every test with an empty app.
  useTasklyStore.setState({ ...emptyState, projects: {}, tasks: {} });
});

describe("projects", () => {
  it("creates a project owned by the built-in user", () => {
    const { projectId } = newProject();
    const project = store().projects[projectId]!;
    expect(project.members).toEqual([{ memberId: APP_USER.id, role: "owner" }]);
  });

  it("refuses an empty name", () => {
    expect(store().createProject({ name: " ", description: "" })).toEqual({
      ok: false,
      error: "Project name can't be empty.",
    });
  });

  it("deletes a project together with its tasks", () => {
    const { projectId, todo } = newProject();
    newTask(projectId, todo);
    expect(store().deleteProject(projectId).ok).toBe(true);
    expect(store().projects).toEqual({});
    expect(store().tasks).toEqual({});
  });

  it("never lets the last owner leave", () => {
    const { projectId } = newProject();
    expect(store().setProjectMemberRole(projectId, APP_USER.id, "member")).toEqual({
      ok: false,
      error: "A project must always have at least one owner.",
    });
  });
});

describe("tasks on the board", () => {
  it("adds a card to a list and writes it in the history", () => {
    const { projectId, todo } = newProject();
    const taskId = newTask(projectId, todo, "Write tests");
    expect(columnsOf(projectId)[0]).toEqual([taskId]);
    expect(store().tasks[taskId]!.activity[0]!.message).toBe("Created this task in To Do");
  });

  it("moves a card to another list and records the move", () => {
    const { projectId, todo, done } = newProject();
    const taskId = newTask(projectId, todo);
    expect(store().moveTask(taskId, done, 0).ok).toBe(true);
    expect(columnsOf(projectId)).toEqual([[], [], [], [taskId]]);
    expect(store().tasks[taskId]!.activity.at(-1)!.message).toBe("Moved from To Do to Done");
  });

  it("reorders cards inside one list without a history line", () => {
    const { projectId, todo } = newProject();
    const first = newTask(projectId, todo, "First");
    const second = newTask(projectId, todo, "Second");
    store().moveTask(first, todo, 1);
    expect(columnsOf(projectId)[0]).toEqual([second, first]);
    expect(store().tasks[first]!.activity).toHaveLength(1);
  });

  it("records edits in plain words and skips non-changes", () => {
    const { projectId, todo } = newProject();
    const taskId = newTask(projectId, todo);
    store().updateTask(taskId, { priority: "urgent" });
    store().updateTask(taskId, { priority: "urgent" }); // same again: nothing new
    const messages = store().tasks[taskId]!.activity.map((a) => a.message);
    expect(messages).toEqual(["Created this task in To Do", "Changed priority from Medium to Urgent"]);
  });

  it("deletes a card from the board and from the task list", () => {
    const { projectId, todo } = newProject();
    const taskId = newTask(projectId, todo);
    store().deleteTask(taskId);
    expect(store().tasks[taskId]).toBeUndefined();
    expect(columnsOf(projectId)[0]).toEqual([]);
  });

  it("checks the checklist and comments", () => {
    const { projectId, todo } = newProject();
    const taskId = newTask(projectId, todo);
    const item = store().addChecklistItem(taskId, "Step one");
    if (!item.ok) throw new Error(item.error);
    store().toggleChecklistItem(taskId, item.value);
    expect(store().tasks[taskId]!.checklist[0]).toMatchObject({ text: "Step one", done: true });
    expect(store().addComment(taskId, "   ").ok).toBe(false);
    expect(store().addComment(taskId, "Looks good").ok).toBe(true);
  });
});

describe("lists and labels", () => {
  it("adds a new list before Done and refuses duplicate names", () => {
    const { projectId } = newProject();
    store().addColumn(projectId, "Testing");
    const titles = store().projects[projectId]!.columns.map((c) => c.title);
    expect(titles).toEqual(["To Do", "In Progress", "Review", "Testing", "Done"]);
    expect(store().addColumn(projectId, "testing").ok).toBe(false);
  });

  it("deleting a list can move its cards somewhere else", () => {
    const { projectId, todo, doing } = newProject();
    const taskId = newTask(projectId, doing);
    store().deleteColumn(projectId, doing, todo);
    expect(columnsOf(projectId)[0]).toEqual([taskId]);
    expect(store().tasks[taskId]).toBeDefined();
  });

  it("deleting a label also removes it from every card", () => {
    const { projectId, todo } = newProject();
    const bug = store().projects[projectId]!.labels[0]!.id;
    const taskId = newTask(projectId, todo);
    store().updateTask(taskId, { labelIds: [bug] });
    store().deleteLabel(projectId, bug);
    expect(store().tasks[taskId]!.labelIds).toEqual([]);
  });
});

describe("archived projects are read-only", () => {
  it("blocks changes until the project is restored", () => {
    const { projectId, todo } = newProject();
    const taskId = newTask(projectId, todo);
    store().setProjectArchived(projectId, true);

    expect(store().createTask(projectId, todo, { title: "Nope" }).ok).toBe(false);
    expect(store().updateTask(taskId, { title: "Nope" }).ok).toBe(false);
    expect(store().addColumn(projectId, "Nope").ok).toBe(false);

    store().setProjectArchived(projectId, false);
    expect(store().updateTask(taskId, { title: "Yes" }).ok).toBe(true);
  });
});
