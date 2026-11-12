"use client";

import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  validateProjectDescription,
  validateProjectName,
} from "@/lib/projects";
import type { Project } from "@/lib/types";
import { useTasklyStore } from "@/store/tasklyStore";
import { SettingsSection } from "./SettingsSection";

/** The project's name and description. */
export function GeneralSettings({ project, canManage }: { project: Project; canManage: boolean }) {
  const updateProject = useTasklyStore((state) => state.updateProject);
  // Only the text you have TYPED is kept here ("draft"). Until you type, the
  // boxes show the saved values, so a rename made somewhere else (the projects
  // page, another tab) shows up here too instead of an old name.
  const [draftName, setDraftName] = useState<string | null>(null);
  const [draftDescription, setDraftDescription] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const name = draftName ?? project.name;
  const description = draftDescription ?? project.description;
  const changed = name.trim() !== project.name || description.trim() !== project.description;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextNameError = validateProjectName(name);
    const nextDescriptionError = validateProjectDescription(description);
    setNameError(nextNameError);
    setDescriptionError(nextDescriptionError);
    if (nextNameError || nextDescriptionError) return;

    const result = updateProject(project.id, { name, description });
    if (!result.ok) return setNameError(result.error);
    // Saved: go back to showing the saved values.
    setDraftName(null);
    setDraftDescription(null);
    setSaved(true);
  }

  return (
    <SettingsSection title="General" description="The project's name and what it is about.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Project name"
          required
          disabled={!canManage}
          value={name}
          onChange={(event) => {
            setDraftName(event.target.value);
            setNameError(null);
            setSaved(false);
          }}
          error={nameError}
          hint={`${name.trim().length}/${PROJECT_NAME_MAX_LENGTH}`}
        />
        <Textarea
          label="Description"
          rows={3}
          disabled={!canManage}
          placeholder="What is this project about?"
          value={description}
          onChange={(event) => {
            setDraftDescription(event.target.value);
            setDescriptionError(null);
            setSaved(false);
          }}
          error={descriptionError}
          hint={`${description.trim().length}/${PROJECT_DESCRIPTION_MAX_LENGTH}`}
        />
        {canManage && (
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!changed}>
              Save changes
            </Button>
            {/* role="status": screen readers announce it when it appears. */}
            <span role="status" className="flex items-center gap-1 text-sm text-success">
              {saved && !changed && (
                <>
                  <Check className="size-4" aria-hidden="true" /> Saved
                </>
              )}
            </span>
          </div>
        )}
      </form>
    </SettingsSection>
  );
}
