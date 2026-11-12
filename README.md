# Taskly

Taskly is a project management app built around a **Kanban board**, like Trello.
You create projects, add cards to lists such as _To Do → In Progress → Done_, and drag
cards between lists as the work moves forward.

It is a **frontend-only** app. There is no server and no login: everything is saved in your
own browser (IndexedDB), so your projects are still there after a refresh or a restart.

## Features

**Projects**
- Create, edit, archive, restore and delete projects
- Each project card shows its progress bar, number of tasks and overdue tasks
- Active / Archived tabs. Archived projects are read-only

**Kanban board**
- Drag and drop cards inside a list and between lists, with the mouse, touch or keyboard
  (Space to pick up, arrow keys to move, Space to drop)
- Add cards and lists right on the board
- Rename, move and delete lists. When deleting a list you choose to move its cards or delete them
- Delete a card with the trash icon on the card
- The **last list counts as "done"**. Done cards are crossed out and never show as overdue

**Search, filter and sort**
- Search cards by title or description (press `/` to jump to the search box)
- Filter by priority, label, due date (overdue / due soon / none) and assignee
- Sort by priority, due date, title or newest first
- Filters are kept in the page address, so a refresh keeps them and the link can be shared

**Task details**
- Opens as a pop-up over the board, or as a full page when the link is opened directly
- Title, description, list, priority, assignee, due date and labels
- Checklist (subtasks), comments, and an automatic activity history
  (for example _"Moved from To Do to Done"_)

**List view**
- All tasks of a project in one table
- Sort by clicking a column heading (▲▼), or with the Sort menu
- Change a task's list straight from the table

**Settings**
- Project settings: name and description, labels (name and colour), members and roles,
  archive or delete
- App settings: light, dark or system theme, profile, and "Reset to demo data"

**Also**
- Brown "coffee" theme with light and dark mode
- Responsive layout for phone, tablet and desktop
- Accessible: real buttons and form fields, keyboard support, screen reader announcements
  for drag and drop

## Tech stack

| What | Used |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Saving data | IndexedDB (through `idb-keyval`) |
| Drag and drop | dnd-kit |
| Icons | lucide-react |
| Tests | Vitest |

## Getting started

You need **Node.js 20.9 or newer**.

```bash
npm install
npm run dev
```

Then open <http://localhost:3000> and click **Get started**.

The first time the app opens it loads three sample projects, so the screens are not empty.
You can bring them back at any time from **Settings → Reset to demo data**.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the app for development |
| `npm run build` | Builds the app for production |
| `npm start` | Runs the production build |
| `npm test` | Runs the automated tests once |
| `npm run test:watch` | Re-runs the tests whenever a file changes |
| `npm run typecheck` | Checks all TypeScript types |
| `npm run lint` | Checks the code with ESLint |

## Pages

| Address | Page |
| --- | --- |
| `/` | Welcome page |
| `/projects` | All projects |
| `/projects/[id]/board` | Kanban board |
| `/projects/[id]/list` | List view (table) |
| `/projects/[id]/settings` | Project settings |
| `/projects/[id]/tasks/[taskId]` | Task details (pop-up from the board, full page when opened directly) |
| `/settings` | App settings |

## Assumptions

- **One built-in user.** There is no backend, so there is no sign-up or login. The app has one
  user, set in `src/lib/user.ts`, who owns every project.
- **The last list is "done".** Progress and overdue counts use this rule. A new list is
  always added _before_ the last one, so "Done" stays last.
- **Due dates are calendar days.** A task is "due soon" if it is due today or within the next
  2 days, and "overdue" if the day has passed and the task is not done.
- Roles (owner, admin, member, viewer) are fully supported in the code, but with a single
  user you will only see yourself as owner.

## Limitations

- Data lives in **one browser on one device**. Clearing site data deletes it, and it is
  not shared with other people or devices.
- No real-time collaboration, notifications or file attachments.
- If the browser blocks IndexedDB (some private windows), the app still opens with the sample
  data, but changes are lost when the tab closes.

## More

See [docs/TECHNICAL.md](docs/TECHNICAL.md) for how the app is built inside.
