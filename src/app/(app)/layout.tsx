import { Suspense } from "react";
import { AppNav, AppNavFallback } from "@/components/layout/AppNav";
import { Header } from "@/components/layout/Header";
import { StoreGate } from "@/components/layout/StoreGate";
import { UserMenu } from "@/components/layout/UserMenu";

/**
 * Layout for the pages INSIDE the app (projects, board, settings…).
 * There is no login: the app always belongs to the one built-in user.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header homeHref="/projects" actions={<UserMenu />}>
        {/* AppNav reads the current address, which is only known per visit,
            so it waits inside Suspense while the rest of the page is ready. */}
        <Suspense fallback={<AppNavFallback />}>
          <AppNav />
        </Suspense>
      </Header>
      {/* Full width: each page decides its own width (the board needs all of it). */}
      <main className="flex min-h-0 w-full flex-1 flex-col">
        <StoreGate>{children}</StoreGate>
      </main>
    </>
  );
}
