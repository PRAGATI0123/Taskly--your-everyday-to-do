# Taskly — technical notes

A short tour of how the app is built.

## 1. Folder structure

```
src/
  app/          Pages and layouts (Next.js App Router)
  components/   Building blocks for the screens, grouped by feature
    ui/         Generic bricks: Button, Input, Modal, Menu, Badge, …
    layout/     Header, navigation, theme toggle, loading gate
    project/    Projects dashboard, project header, sidebar, project settings
    board/      Kanban board, lists, cards, toolbar
    task/       Task details (pop-up and full page)
    list/       List view table
    settings/   App settings
  hooks/        Reusable React hooks (theme, board filters)
  lib/          Plain TypeScript logic, no React (board rules, filters, sorting, dates…)
  store/        The Zustand store and saving to IndexedDB
  test/         Helpers for the tests
```

The main rule: **logic lives in `lib/`, screens live in `components/`**. Functions in `lib/`
take data in and return new data out. They never change what they were given, and they
don't know about React. That makes them easy to test and reuse.

## 2. Pages and routing

The app uses the Next.js App Router:

- **Route groups**: `(public)` holds the welcome page and `(app)` holds the app with its
  header. The brackets keep the group name out of the address.
- **Dynamic segments**: `projects/[projectId]` and `tasks/[taskId]`.
- **Shared project layout**: `projects/[projectId]/layout.tsx` draws the sidebar, the project
  header and the Board / List / Project settings tabs once for all three tabs.
- **Task pop-up**: a parallel route (`@modal`) plus an intercepting route
  (`(.)tasks/[taskId]`). Clicking a card opens the task as a pop-up over the board, and the
  address changes so it can be shared. Opening that address directly shows the full page
  version instead. Both use the same `TaskDetails` component.
- **Special files**: `loading.tsx`, `error.tsx` and `not-found.tsx` handle waiting, crashes
  and unknown addresses.

The project uses Cache Components, so anything that reads the address (`params`,
`useSearchParams`) is wrapped in `<Suspense>`.

## 3. Data model

Defined in `src/lib/types.ts`:

```
TasklyData
  members:  Member[]                 the people (one built-in user)
  projects: { [id]: Project }
  tasks:    { [id]: Task }

Project: name, description, archived, labels, members (with roles), columns
Column:  id, title, taskIds[]        the order of cards in the list
Task:    title, description, priority, assigneeId, labelIds, dueDate,
         checklist, comments, activity, createdAt, updatedAt
```

Two choices worth knowing:

- Projects and tasks are kept in **dictionaries** (`id → item`), so any item is found
  instantly.
- **A task does not store its list.** Only `column.taskIds` says where a card is, so the two
  can never disagree. Moving a card only changes the lists' `taskIds`.

## 4. State and saving

`src/store/tasklyStore.ts` is a single Zustand store that holds all data and every action
(create project, move task, add comment, …). Each action:

1. checks the rules: does the item exist, is the user allowed, is the input valid, is the
   project archived?
2. works out the new data with the plain functions from `lib/`
3. saves it with `set(...)`. Every screen that uses that data redraws by itself

Actions return `{ ok: true, value }` or `{ ok: false, error }`, so screens can show a friendly
message instead of crashing.

**Saving**: Zustand's `persist` middleware copies the data into **IndexedDB** after every
change (`src/store/storage.ts`, using `idb-keyval`). Because the server has no IndexedDB,
loading is started in the browser (`StoreProvider` → `startStore()`), and `StoreGate` shows a
spinner until the data is ready. On the very first visit the store is filled with sample data
(`lib/sample-data.ts`). The saved data has a version number, so older saved data can be
upgraded (`migrate`).

## 5. Drag and drop

Built with **dnd-kit** in `components/board/KanbanBoard.tsx`:

- Every list is a drop zone and every card is sortable.
- While dragging, the board shows a **draft** copy of the lists, so cards make room smoothly.
  Only when the card is dropped is the real move saved with `store.moveTask`.
- Mouse, touch and keyboard all work. The keyboard uses a custom helper so ←/→ jump to the
  next list and ↑/↓ move within a list.
- Screen readers hear what is happening ("Picked up …", "… is over Done").
- When a filter hides some cards, `resolveDropIndex` (in `lib/filters.ts`) works out the right
  position in the full list.

## 6. Filters, search and sort

`lib/filters.ts` holds the logic and `hooks/useBoardFilters.ts` connects it to the address.
Filters are written into the address (for example `?q=login&priority=high&sort=due`), so a
refresh keeps them. The board and the List view share the same filters. The List view sorts
with `lib/table.ts`, where empty values (no due date, nobody assigned) always go last.

## 7. Business rules

| Rule | Where |
| --- | --- |
| The last list is "done". A new list is added before it | `lib/board.ts` |
| A board keeps at least one list | `lib/board.ts` |
| A done task is never overdue. "Due soon" means within 2 days | `lib/tasks.ts`, `lib/projects.ts` |
| A project keeps at least one owner | `store/tasklyStore.ts` |
| Archived projects are read-only | `store/tasklyStore.ts` |
| No two lists or labels with the same name | `lib/board.ts`, `lib/projects.ts` |
| Roles: owner / admin / member / viewer | `lib/permissions.ts` |

## 8. Theme and styling

Tailwind CSS v4 with colour tokens in `src/app/globals.css` (brown "coffee" palette).
Dark mode sets `data-theme="dark"` on the page. A tiny script in the page head applies the
saved theme **before** the page is drawn, so there is no white flash. The choice is kept in
`localStorage`.

## 9. Tests

`npm test` runs **Vitest**. Tests sit next to the code they check (`*.test.ts`):

| File | What it checks |
| --- | --- |
| `lib/board.test.ts` | Moving cards, adding/renaming/deleting lists, progress |
| `lib/filters.test.ts` | Filters in the address, matching, sorting, dropping into a filtered list |
| `lib/table.test.ts` | List view sorting |
| `lib/tasks.test.ts` | Due-date status, dates, building tasks, activity messages |
| `lib/projects.test.ts` | Building projects, validators, stats, permissions, sample data |
| `store/tasklyStore.test.ts` | Store actions end to end (IndexedDB replaced by an in-memory box) |
