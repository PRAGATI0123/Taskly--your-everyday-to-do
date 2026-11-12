/**
 * Demo data loaded the very first time the app opens, so nobody starts with
 * an empty screen. Due dates are worked out from TODAY, so there are always
 * some overdue tasks, some due soon and some due later.
 */
import { createId } from "./id";
import { DEFAULT_LABELS } from "./projects";
import type {
  ActivityEntry,
  ID,
  MemberRole,
  Priority,
  Project,
  Task,
  TasklyData,
} from "./types";
import { APP_USER } from "./user";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Short name used in the recipes below: the app's one user. */
const ME = APP_USER.id;

// ---------------------------------------------------------------------------
// Recipes: a short way to describe projects and tasks
// ---------------------------------------------------------------------------

interface TaskRecipe {
  title: string;
  description?: string;
  priority: Priority;
  assignee?: ID;
  labels?: string[]; // label names, e.g. ["Bug"]
  /** Days from today: -2 = two days ago (overdue), 5 = in five days. */
  due?: number;
  checklist?: [text: string, done: boolean][];
  comments?: [authorId: ID, text: string][];
}

interface ProjectRecipe {
  name: string;
  description: string;
  archived?: boolean;
  members: [memberId: ID, role: MemberRole][];
  columns: { title: string; tasks: TaskRecipe[] }[];
}

const RECIPES: ProjectRecipe[] = [
  {
    name: "Website Redesign",
    description: "Refresh the company website with a warmer look and faster pages.",
    members: [[ME, "owner"]],
    columns: [
      {
        title: "To Do",
        tasks: [
          {
            title: "Write copy for the About page",
            priority: "medium",
            assignee: ME,
            labels: ["Docs"],
            due: 6,
          },
          {
            title: "Add a dark mode toggle",
            description: "Users asked for a dark theme in the last survey.",
            priority: "low",
            labels: ["Feature"],
            due: 14,
          },
          {
            title: "Fix broken links in the footer",
            priority: "high",
            assignee: ME,
            labels: ["Bug"],
            due: -2,
          },
        ],
      },
      {
        title: "In Progress",
        tasks: [
          {
            title: "Design the new homepage",
            description: "Hero section, featured projects and a clear call to action.",
            priority: "urgent",
            assignee: ME,
            labels: ["Design"],
            due: 2,
            checklist: [
              ["Moodboard", true],
              ["Wireframe", true],
              ["High-fidelity mockup", false],
              ["Get feedback from the team", false],
            ],
            comments: [
              [ME, "Trying a bigger 64px headline in the next version."],
            ],
          },
          {
            title: "Speed up image loading",
            priority: "high",
            assignee: ME,
            labels: ["Feature"],
            due: 4,
            checklist: [
              ["Convert images to WebP", true],
              ["Add lazy loading", false],
            ],
          },
        ],
      },
      {
        title: "Review",
        tasks: [
          {
            title: "Contact form validation",
            priority: "medium",
            assignee: ME,
            labels: ["Feature"],
            due: -1,
            comments: [[ME, "Tested on mobile, the error messages look good."]],
          },
        ],
      },
      {
        title: "Done",
        tasks: [
          {
            title: "Choose the colour palette",
            priority: "medium",
            assignee: ME,
            labels: ["Design"],
            due: -6,
          },
          {
            title: "Set up the project repository",
            priority: "low",
            assignee: ME,
            due: -9,
          },
        ],
      },
    ],
  },
  {
    name: "Mobile App Launch",
    description: "Ship version 1.0 of the Taskly mobile app to both app stores.",
    members: [[ME, "owner"]],
    columns: [
      {
        title: "Backlog",
        tasks: [
          {
            title: "Push notifications for due dates",
            priority: "medium",
            labels: ["Feature"],
            due: 21,
          },
          {
            title: "Offline mode",
            priority: "low",
            labels: ["Feature"],
          },
        ],
      },
      {
        title: "In Progress",
        tasks: [
          {
            title: "App store screenshots",
            priority: "high",
            assignee: ME,
            labels: ["Design"],
            due: 3,
          },
          {
            title: "Crash when rotating the screen",
            priority: "urgent",
            assignee: ME,
            labels: ["Bug"],
            due: -1,
            comments: [[ME, "Only happens on Android 13. Looking into it."]],
          },
        ],
      },
      {
        title: "Testing",
        tasks: [
          {
            title: "Beta test with 20 users",
            priority: "high",
            assignee: ME,
            due: 5,
            checklist: [
              ["Invite testers", true],
              ["Collect feedback", false],
            ],
          },
        ],
      },
      {
        title: "Released",
        tasks: [
          {
            title: "Login screen",
            priority: "medium",
            assignee: ME,
            due: -10,
          },
        ],
      },
    ],
  },
  {
    name: "Office Move 2025",
    description: "Moving the team to the new office. Finished and archived.",
    archived: true,
    members: [[ME, "owner"]],
    columns: [
      { title: "To Do", tasks: [] },
      {
        title: "Done",
        tasks: [
          { title: "Book the movers", priority: "high", assignee: ME, due: -60 },
          { title: "Set up Wi-Fi", priority: "medium", assignee: ME, due: -58 },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Turning the recipes into real data
// ---------------------------------------------------------------------------

/** Builds a fresh copy of all the demo data (new ids every time). */
export function createSampleData(now: Date = new Date()): TasklyData {
  const createdAt = new Date(now.getTime() - 14 * DAY).toISOString();
  const updatedAt = new Date(now.getTime() - 1 * DAY).toISOString();
  const dayFromToday = (offset: number) =>
    new Date(now.getTime() + offset * DAY).toISOString().slice(0, 10);

  // Every task gets its OWN creation time (18 hours apart), so sorting by
  // "Newest first" or "Last updated" actually changes the order. Inside each
  // project, tasks in later lists (like Done) were created earlier.
  let taskNumber = 0;
  const nextCreatedAt = () =>
    new Date(now.getTime() - 14 * DAY + taskNumber++ * 18 * HOUR).toISOString();

  const projects: Record<ID, Project> = {};
  const tasks: Record<ID, Task> = {};

  for (const recipe of RECIPES) {
    const projectId = createId();
    const labels = DEFAULT_LABELS.map((label) => ({ ...label, id: createId() }));
    const labelId = (name: string) => labels.find((l) => l.name === name)?.id;
    const firstColumnTitle = recipe.columns[0]?.title ?? "To Do";
    const createdTimes = new Map(
      [...recipe.columns].reverse().flatMap((c) => c.tasks).map((t) => [t, nextCreatedAt()]),
    );

    const columns = recipe.columns.map((columnRecipe) => {
      const taskIds = columnRecipe.tasks.map((t) => {
        const taskCreatedAt = createdTimes.get(t) ?? createdAt;
        const moved = columnRecipe.title !== firstColumnTitle;
        const taskUpdatedAt = moved ? updatedAt : taskCreatedAt;
        const activity: ActivityEntry[] = [
          {
            id: createId(),
            actorId: ME,
            message: `Created this task in ${firstColumnTitle}`,
            at: taskCreatedAt,
          },
        ];
        if (moved) {
          activity.push({
            id: createId(),
            actorId: t.assignee ?? ME,
            message: `Moved from ${firstColumnTitle} to ${columnRecipe.title}`,
            at: updatedAt,
          });
        }

        const task: Task = {
          id: createId(),
          projectId,
          title: t.title,
          description: t.description ?? "",
          priority: t.priority,
          assigneeId: t.assignee ?? null,
          labelIds: (t.labels ?? [])
            .map(labelId)
            .filter((id): id is ID => id !== undefined),
          dueDate: t.due === undefined ? null : dayFromToday(t.due),
          checklist: (t.checklist ?? []).map(([text, done]) => ({
            id: createId(),
            text,
            done,
          })),
          comments: (t.comments ?? []).map(([authorId, text]) => ({
            id: createId(),
            authorId,
            text,
            createdAt: updatedAt,
          })),
          activity,
          createdAt: taskCreatedAt,
          updatedAt: taskUpdatedAt,
        };
        tasks[task.id] = task;
        return task.id;
      });

      return { id: createId(), title: columnRecipe.title, taskIds };
    });

    projects[projectId] = {
      id: projectId,
      name: recipe.name,
      description: recipe.description,
      columns,
      labels,
      members: recipe.members.map(([memberId, role]) => ({ memberId, role })),
      archived: recipe.archived ?? false,
      createdAt,
      updatedAt,
    };
  }

  return { members: [APP_USER], projects, tasks };
}
