"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui";
import { formatRelativeTime } from "@/lib/dates";
import type { Member, Task } from "@/lib/types";
import { Section } from "./Section";

const SHOW_FIRST = 5;

/** The task's history, newest first: "Moved from To Do to Done", … */
export function TaskActivity({ task, members }: { task: Task; members: Member[] }) {
  const [showAll, setShowAll] = useState(false);
  const newestFirst = [...task.activity].reverse();
  const shown = showAll ? newestFirst : newestFirst.slice(0, SHOW_FIRST);

  return (
    <Section
      icon={<History />}
      title="Activity"
      action={
        newestFirst.length > SHOW_FIRST ? (
          <Button variant="ghost" size="sm" onClick={() => setShowAll((all) => !all)}>
            {showAll ? "Show less" : `Show all (${newestFirst.length})`}
          </Button>
        ) : undefined
      }
    >
      {/* A timeline: a line down the left with a dot for each event. */}
      <ol className="relative flex flex-col gap-3 border-l border-border pl-4">
        {shown.map((entry) => {
          const actor = members.find((m) => m.id === entry.actorId);
          return (
            <li key={entry.id} className="relative text-sm">
              <span
                aria-hidden="true"
                className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-surface bg-accent"
              />
              <span className="font-semibold">{actor?.name ?? "Taskly"}</span>{" "}
              <span className="text-muted">
                {entry.message.charAt(0).toLowerCase() + entry.message.slice(1)}
              </span>
              <p className="text-xs text-muted">
                <time dateTime={entry.at}>{formatRelativeTime(entry.at)}</time>
              </p>
            </li>
          );
        })}
        {shown.length === 0 && <li className="text-sm text-muted">No activity yet.</li>}
      </ol>
    </Section>
  );
}
