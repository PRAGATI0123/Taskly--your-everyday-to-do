"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { MessageSquare } from "lucide-react";
import { Avatar, Button, Textarea } from "@/components/ui";
import { formatRelativeTime } from "@/lib/dates";
import type { Member, Task } from "@/lib/types";
import { useCurrentUser } from "@/store/selectors";
import { useTasklyStore } from "@/store/tasklyStore";
import { Section } from "./Section";

/** Write and read messages on a task. Newest first. */
export function TaskComments({
  task,
  members,
  canEdit,
}: {
  task: Task;
  members: Member[];
  canEdit: boolean;
}) {
  const addComment = useTasklyStore((state) => state.addComment);
  const user = useCurrentUser();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent | KeyboardEvent<HTMLTextAreaElement>) {
    event.preventDefault();
    const result = addComment(task.id, text);
    if (!result.ok) return setError(result.error);
    setText("");
    setError(null);
  }

  const newestFirst = [...task.comments].reverse();

  return (
    <Section icon={<MessageSquare />} title={`Comments (${task.comments.length})`}>
      {canEdit && user && (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Avatar name={user.name} color={user.color} size="sm" className="mt-1" />
          <div className="flex flex-1 flex-col gap-2">
            <Textarea
              aria-label="Write a comment"
              rows={2}
              placeholder="Write a comment…"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                // Ctrl/⌘ + Enter sends, like many chat apps.
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                  handleSubmit(event);
                }
              }}
              error={error}
            />
            {text.trim() && (
              <Button type="submit" size="sm" className="w-fit">
                Save comment
              </Button>
            )}
          </div>
        </form>
      )}

      <ul className="flex flex-col gap-3">
        {newestFirst.map((comment) => {
          const author = members.find((m) => m.id === comment.authorId);
          return (
            <li key={comment.id} className="flex gap-3">
              <Avatar
                name={author?.name ?? "Someone"}
                color={author?.color ?? "#7a6352"}
                size="sm"
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">
                  <span className="font-semibold text-foreground">{author?.name ?? "Someone"}</span>{" "}
                  · {formatRelativeTime(comment.createdAt)}
                </p>
                <p className="mt-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm whitespace-pre-wrap">
                  {comment.text}
                </p>
              </div>
            </li>
          );
        })}
        {task.comments.length === 0 && !canEdit && (
          <li className="text-sm text-muted">No comments yet.</li>
        )}
      </ul>
    </Section>
  );
}
