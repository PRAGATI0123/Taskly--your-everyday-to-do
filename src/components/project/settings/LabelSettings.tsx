"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { Badge, Button, ConfirmDialog, EmptyState, IconButton, Input } from "@/components/ui";
import { LABEL_COLORS, LABEL_NAME_MAX_LENGTH } from "@/lib/projects";
import type { ID, Label, Project } from "@/lib/types";
import { useTasklyStore } from "@/store/tasklyStore";
import { ColorPicker } from "./ColorPicker";
import { SettingsSection } from "./SettingsSection";

/** Add, rename, recolour and delete the project's labels. */
export function LabelSettings({ project, canManage }: { project: Project; canManage: boolean }) {
  const tasks = useTasklyStore((state) => state.tasks);
  const deleteLabel = useTasklyStore((state) => state.deleteLabel);
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [deletingId, setDeletingId] = useState<ID | null>(null);

  // How many cards in this project wear each label.
  const usage = (labelId: ID) =>
    Object.values(tasks).filter((t) => t.projectId === project.id && t.labelIds.includes(labelId))
      .length;

  const deleting = project.labels.find((l) => l.id === deletingId);
  const deletingUsage = deleting ? usage(deleting.id) : 0;

  return (
    <SettingsSection
      title="Labels"
      description="Coloured tags you can put on cards, like Bug or Design."
    >
      <div className="flex flex-col gap-4">
        {project.labels.length === 0 ? (
          <EmptyState
            icon={<Tag className="size-6" />}
            title="No labels yet"
            description="Add a label below to start tagging cards."
            className="py-6"
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
            {project.labels.map((label) =>
              editingId === label.id ? (
                <li key={label.id} className="p-3">
                  <LabelForm
                    project={project}
                    label={label}
                    onDone={() => setEditingId(null)}
                  />
                </li>
              ) : (
                <li key={label.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Badge color={label.color}>{label.name}</Badge>
                  <span className="flex-1 text-xs text-muted">
                    on {usage(label.id)} {usage(label.id) === 1 ? "card" : "cards"}
                  </span>
                  {canManage && (
                    <>
                      <IconButton
                        size="sm"
                        icon={<Pencil className="size-4" />}
                        label={`Edit ${label.name}`}
                        onClick={() => setEditingId(label.id)}
                      />
                      <IconButton
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="size-4" />}
                        label={`Delete ${label.name}`}
                        onClick={() => setDeletingId(label.id)}
                      />
                    </>
                  )}
                </li>
              ),
            )}
          </ul>
        )}

        {canManage && editingId === null && (
          <div className="rounded-xl border border-dashed border-border p-3">
            <p className="mb-3 text-sm font-medium">Add a label</p>
            <LabelForm project={project} onDone={() => undefined} />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleting !== undefined}
        title="Delete label?"
        confirmLabel="Delete label"
        danger
        onConfirm={() => {
          if (deleting) deleteLabel(project.id, deleting.id);
          setDeletingId(null);
        }}
        onCancel={() => setDeletingId(null)}
      >
        <p>
          The label <strong className="text-foreground">{deleting?.name}</strong> will be
          deleted
          {deletingUsage > 0
            ? ` and removed from the ${deletingUsage} ${deletingUsage === 1 ? "card that uses" : "cards that use"} it`
            : ""}
          . The cards themselves stay.
        </p>
      </ConfirmDialog>
    </SettingsSection>
  );
}

/** One form for both "add a label" and "edit this label". */
function LabelForm({
  project,
  label,
  onDone,
}: {
  project: Project;
  label?: Label;
  onDone: () => void;
}) {
  const addLabel = useTasklyStore((state) => state.addLabel);
  const updateLabel = useTasklyStore((state) => state.updateLabel);
  const [name, setName] = useState(label?.name ?? "");
  const [color, setColor] = useState<string>(label?.color ?? LABEL_COLORS[0].value);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = label
      ? updateLabel(project.id, label.id, { name, color })
      : addLabel(project.id, name, color);
    if (!result.ok) return setError(result.error);
    setError(null);
    if (!label) setName(""); // ready for the next new label
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start gap-2">
        <Input
          aria-label="Label name"
          placeholder="e.g. Urgent fix"
          autoFocus={label !== undefined}
          maxLength={LABEL_NAME_MAX_LENGTH + 10}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && label) {
              event.preventDefault();
              onDone();
            }
          }}
          error={error}
          className="h-9 w-56"
        />
        {/* Live preview of how the label will look on cards. */}
        <span className="flex h-9 items-center">
          <Badge color={color}>{name.trim() || "Preview"}</Badge>
        </span>
      </div>
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" icon={label ? undefined : <Plus className="size-4" />}>
          {label ? "Save" : "Add label"}
        </Button>
        {label && (
          <Button size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
