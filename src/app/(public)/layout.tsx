import { Header } from "@/components/layout/Header";

/**
 * Layout for the public welcome page.
 * The "(public)" folder name is a ROUTE GROUP: it groups pages without
 * adding "/public" to the web address.
 */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
