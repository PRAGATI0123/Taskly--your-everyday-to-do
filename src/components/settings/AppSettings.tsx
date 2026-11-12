"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { SettingsSection } from "@/components/project/settings/SettingsSection";
import { Avatar, Button, ConfirmDialog } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/cn";
import type { ThemePreference } from "@/lib/theme";
import { useCurrentUser } from "@/store/selectors";
import { deleteAllData } from "@/store/startup";
import { useTasklyStore } from "@/store/tasklyStore";

const THEMES: { value: ThemePreference; label: string; hint: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", hint: "Cream and coffee", icon: Sun },
  { value: "dark", label: "Dark", hint: "Espresso", icon: Moon },
  { value: "system", label: "System", hint: "Follows your computer", icon: Monitor },
];

/** The app-wide Settings page (not one project's settings). */
export function AppSettings() {
  return (
    <div className="mx-auto flex w-full max-w-4xl animate-fade-up flex-col gap-5 px-4 py-8">
      <div>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Options for the whole app. Each project also has its own Project settings.
        </p>
      </div>
      <AppearanceSettings />
      <ProfileSettings />
      <DataSettings />
    </div>
  );
}

/** Light / Dark / System — the same choice as the button in the top bar. */
function AppearanceSettings() {
  const { preference, setPreference } = useTheme();

  return (
    <SettingsSection title="Appearance" description="How Taskly looks. Saved on this device.">
      {/* Real radio buttons, so arrow keys move between the three choices. */}
      <fieldset>
        <legend className="sr-only">Theme</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {THEMES.map((theme) => {
            const Icon = theme.icon;
            const selected = preference === theme.value;
            return (
              <label
                key={theme.value}
                className={cn(
                  "relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3 transition-all",
                  "has-focus-visible:ring-2 has-focus-visible:ring-primary",
                  selected
                    ? "border-accent bg-primary/8 shadow-sm"
                    : "border-border hover:border-accent/50 hover:bg-surface-muted/60",
                )}
              >
                <input
                  type="radio"
                  name="theme"
                  value={theme.value}
                  checked={selected}
                  onChange={() => setPreference(theme.value)}
                  className="sr-only"
                />
                {/* A tiny picture of the theme */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-14 items-end gap-1 rounded-lg border border-border p-2",
                    theme.value === "light" && "bg-[#faf6f0]",
                    theme.value === "dark" && "bg-[#16100c]",
                    theme.value === "system" && "bg-linear-to-r from-[#faf6f0] from-50% to-[#16100c] to-50%",
                  )}
                >
                  <span className="h-6 w-4 rounded bg-[#a86b40]" />
                  <span className="h-8 w-4 rounded bg-[#d4a373]" />
                  <span className="h-4 w-4 rounded bg-[#7d4f33]" />
                </span>
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="size-4" aria-hidden="true" />
                  {theme.label}
                  {selected && <Check className="ml-auto size-4 text-primary" aria-hidden="true" />}
                </span>
                <span className="text-xs text-muted">{theme.hint}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </SettingsSection>
  );
}

/** Who is using Taskly. */
function ProfileSettings() {
  const user = useCurrentUser();
  if (!user) return null;

  return (
    <SettingsSection title="Profile" description="Taskly has one built-in user — you.">
      <div className="flex items-center gap-4 rounded-xl border border-border p-4">
        <Avatar name={user.name} color={user.color} size="lg" />
        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-muted">Owner of every project</p>
        </div>
      </div>
     
    </SettingsSection>
  );
}

/** What is saved, and starting fresh. */
function DataSettings() {
  const router = useRouter();
  const projects = useTasklyStore((state) => state.projects);
  const tasks = useTasklyStore((state) => state.tasks);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const projectCount = Object.keys(projects).length;
  const taskCount = Object.keys(tasks).length;

  return (
    <SettingsSection
      title="Your data"
      description="Everything is saved in this browser (IndexedDB), not on a server."
    >
      <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-48 flex-1">
            <p className="text-sm font-semibold">Saved in this browser</p>
            <p className="text-xs text-muted">
              {projectCount} {projectCount === 1 ? "project" : "projects"} · {taskCount}{" "}
              {taskCount === 1 ? "task" : "tasks"}. Kept after refresh and restart.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-48 flex-1">
            <p className="text-sm font-semibold text-danger">Delete all data</p>
            <p className="text-xs text-muted">
              Deletes every project and task, so you can start again from scratch.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="size-4" />}
            onClick={() => setConfirmingDelete(true)}
            disabled={projectCount === 0}
          >
            Delete all
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete all data?"
        confirmLabel="Delete everything"
        danger
        onConfirm={() => {
          deleteAllData();
          setConfirmingDelete(false);
          router.push("/projects");
        }}
        onCancel={() => setConfirmingDelete(false)}
      >
        <p>
          All {projectCount} {projectCount === 1 ? "project" : "projects"} and {taskCount}{" "}
          {taskCount === 1 ? "task" : "tasks"} will be deleted. This can&apos;t be undone.
        </p>
      </ConfirmDialog>
    </SettingsSection>
  );
}
