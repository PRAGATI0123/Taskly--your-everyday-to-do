"use client";

import { useId, useState, type FormEvent } from "react";
import { Button, Input, Modal, Textarea } from "@/components/ui";
import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  validateProjectDescription,
  validateProjectName,
} from "@/lib/projects";
import type { Project } from "@/lib/types";

export interface ProjectFormValues {
  name: string;
  description: string;
}

interface ProjectFormModalProps {
  open: boolean;
  /** Give a project to EDIT it; leave it out to CREATE a new one. */
  project?: Project;
  onClose: () => void;
  /** Return an error message to show, or null if it worked. */
  onSubmit: (values: ProjectFormValues) => string | null;
}

/** One form for both "New project" and "Edit project". */
export function ProjectFormModal({ open, project, onClose, onSubmit }: ProjectFormModalProps) {
  const editing = project !== undefined;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit project" : "New project"}
      description={
        editing
          ? "Change the name or description."
          : "A new board with To Do, In Progress, Review and Done columns."
      }
      footer={null}
    >
      {/* The form is a separate component so it starts fresh each time the
          pop-up opens (the Modal only builds its contents while open). */}
      <ProjectForm project={project} onCancel={onClose} onSubmit={onSubmit} />
    </Modal>
  );
}

function ProjectForm({
  project,
  onCancel,
  onSubmit,
}: {
  project?: Project;
  onCancel: () => void;
  onSubmit: (values: ProjectFormValues) => string | null;
}) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const formId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Check each box with the same rules the store uses.
    const nextNameError = validateProjectName(name);
    const nextDescriptionError = validateProjectDescription(description);
    setNameError(nextNameError);
    setDescriptionError(nextDescriptionError);
    if (nextNameError || nextDescriptionError) return;

    setFormError(onSubmit({ name, description }));
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="Project name"
        required
        data-autofocus
        placeholder="e.g. Website Redesign"
        maxLength={PROJECT_NAME_MAX_LENGTH + 20}
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setNameError(null);
        }}
        error={nameError}
        hint={`${name.trim().length}/${PROJECT_NAME_MAX_LENGTH}`}
      />
      <Textarea
        label="Description"
        rows={3}
        placeholder="What is this project about?"
        value={description}
        onChange={(event) => {
          setDescription(event.target.value);
          setDescriptionError(null);
        }}
        error={descriptionError}
        hint={`${description.trim().length}/${PROJECT_DESCRIPTION_MAX_LENGTH}`}
      />
      {formError && (
        <p role="alert" className="text-sm font-medium text-danger">
          {formError}
        </p>
      )}
      <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{project ? "Save changes" : "Create project"}</Button>
      </div>
    </form>
  );
}
