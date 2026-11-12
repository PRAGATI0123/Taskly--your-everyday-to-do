"use client";

import { Avatar, Badge } from "@/components/ui";
import type { Member, MemberRole, Project } from "@/lib/types";
import { useTasklyStore } from "@/store/tasklyStore";
import { SettingsSection } from "./SettingsSection";

const ROLES: Record<MemberRole, { name: string; can: string }> = {
  owner: { name: "Owner", can: "Everything, including deleting the project" },
  admin: { name: "Admin", can: "Edit tasks and change project settings" },
  member: { name: "Member", can: "Add, edit and move tasks" },
  viewer: { name: "Viewer", can: "Look only — can't change anything" },
};

/** Who is in the project and what each person is allowed to do. */
export function MemberSettings({ project }: { project: Project }) {
  const members = useTasklyStore((state) => state.members);
  const currentUserId = useTasklyStore((state) => state.currentUserId);

  const people = project.members
    .map((pm) => ({ ...pm, member: members.find((m) => m.id === pm.memberId) }))
    .filter((p): p is typeof p & { member: Member } => p.member !== undefined);

  return (
    <SettingsSection
      title="Members & roles"
      description="Who is in this project and what they are allowed to do."
    >
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {people.map(({ member, role }) => (
            <li key={member.id} className="flex items-center gap-3 px-3 py-2.5">
              <Avatar name={member.name} color={member.color} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {member.name}
                  {member.id === currentUserId && <span className="text-muted"> (you)</span>}
                </p>
                <p className="text-xs text-muted">{ROLES[role].can}</p>
              </div>
              <Badge tone="primary">{ROLES[role].name}</Badge>
            </li>
          ))}
        </ul>

        {/* The rules every role follows (kept in lib/permissions.ts). */}
        <details className="rounded-xl bg-surface-muted/60 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium">What can each role do?</summary>
          <ul className="mt-2 flex flex-col gap-1 text-muted">
            {Object.values(ROLES).map((role) => (
              <li key={role.name}>
                <span className="font-semibold text-foreground">{role.name}</span> — {role.can}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            Taskly has one built-in user, so you are the owner of every project. A project
            always keeps at least one owner.
          </p>
        </details>
      </div>
    </SettingsSection>
  );
}
