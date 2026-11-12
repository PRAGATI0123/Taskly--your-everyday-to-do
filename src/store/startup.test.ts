import { beforeEach, describe, expect, it, vi } from "vitest";

// A pretend IndexedDB: a simple in-memory box we can fill before each test.
const box = vi.hoisted(() => new Map<string, unknown>());
vi.mock("idb-keyval", () => ({
  get: async (key: string) => box.get(key),
  set: async (key: string, value: unknown) => void box.set(key, value),
  del: async (key: string) => void box.delete(key),
}));

/** Loads fresh copies of the store files, as if the page was just opened. */
async function openApp() {
  vi.resetModules();
  const startup = await import("./startup");
  const { useTasklyStore } = await import("./tasklyStore");
  await startup.startStore();
  return { startup, store: useTasklyStore };
}

beforeEach(() => box.clear());

describe("starting the app", () => {
  it("a first-time visitor starts with no projects", async () => {
    const { startup, store } = await openApp();
    expect(startup.useStartupStore.getState()).toEqual({ status: "ready", error: null });
    expect(store.getState().projects).toEqual({});
  });

  it("loads what was saved before, keeping the name the person chose", async () => {
    const first = await openApp();
    first.store.getState().updateMyName("Riya");
    first.store.getState().createProject({ name: "Saved project", description: "" });
    await vi.waitFor(() => expect(box.size).toBe(1));

    const second = await openApp();
    const projects = Object.values(second.store.getState().projects);
    expect(projects.map((p) => p.name)).toEqual(["Saved project"]);
    expect(second.store.getState().members[0]?.name).toBe("Riya");
  });

  it("never overwrites saved data it could not read, and warns the person", async () => {
    box.set("taskly-data", "{ this is not valid JSON");
    const { startup, store } = await openApp();

    expect(startup.useStartupStore.getState().status).toBe("error");
    store.getState().createProject({ name: "New", description: "" });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(box.get("taskly-data")).toBe("{ this is not valid JSON"); // untouched

    // This warning can't be closed, because saving stays switched off.
    startup.dismissStorageError();
    expect(startup.useStartupStore.getState().error).not.toBeNull();
  });
});
