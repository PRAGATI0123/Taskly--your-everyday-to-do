import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  /** Where the logo goes when clicked. */
  homeHref?: string;
  /** Extra things in the middle of the bar, e.g. navigation links. */
  children?: ReactNode;
  /** Extra things on the right, before the theme button. */
  actions?: ReactNode;
}

/** The bar at the top of the page: logo, optional links, theme button. */
export function Header({ homeHref = "/", children, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:gap-6">
        <Link
          href={homeHref}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          {/* Two pictures of the logo: CSS shows the right one for the theme. */}
          <Image src="/logo.png" alt="" width={25} height={26} priority className="dark:hidden" />
          <Image
            src="/logo-dark.png"
            alt=""
            width={25}
            height={26}
            priority
            className="hidden dark:block"
          />
          {/* On narrow phones only the logo picture shows, to save space. */}
          <span className="hidden font-display text-xl font-bold tracking-tight text-foreground min-[420px]:inline">
            Taskly
          </span>
          <span className="sr-only min-[420px]:hidden">Taskly</span>
        </Link>

        <div className="flex min-w-0 flex-1 items-center">{children}</div>

        <div className="flex shrink-0 items-center gap-1">
          {actions}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
