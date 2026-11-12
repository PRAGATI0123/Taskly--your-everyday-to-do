"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/settings", label: "Settings" },
];

/** The links in the app's top bar. The current page's link is highlighted. */
export function AppNav() {
  const pathname = usePathname();
  return <NavLinks pathname={pathname} />;
}

/** Shown while the current address is not known yet (nothing highlighted). */
export function AppNavFallback() {
  return <NavLinks pathname={null} />;
}

function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="flex items-center gap-1">
      {LINKS.map((link) => {
        const active = pathname?.startsWith(link.href) ?? false;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-2 py-1.5 text-sm font-medium transition-colors sm:px-3",
              "focus-visible:outline-2 focus-visible:outline-primary",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted hover:bg-surface-muted hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
