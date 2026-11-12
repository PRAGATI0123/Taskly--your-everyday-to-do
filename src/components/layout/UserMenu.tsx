"use client";

import { Avatar } from "@/components/ui";
import { useCurrentUser } from "@/store/selectors";

/** Shows who is using Taskly (top bar, right side). */
export function UserMenu() {
  const user = useCurrentUser();
  if (!user) return null;

  return (
    <div className="mr-1 flex items-center gap-2 border-r border-border pr-2">
      <Avatar name={user.name} color={user.color} size="sm" />
      <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
    </div>
  );
}
