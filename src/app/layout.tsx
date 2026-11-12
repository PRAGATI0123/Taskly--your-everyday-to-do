import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { StoreProvider } from "@/components/layout/StoreProvider";
import { ThemeScript } from "@/components/layout/ThemeScript";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Elegant serif font for headings (used via the `font-display` class)
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Organize projects and move tasks across a drag-and-drop Kanban board. Free, fast, and saved right in your browser.";

/**
 * The site's full address, needed for share previews. On Vercel it is filled
 * in automatically; on your own computer it is localhost.
 */
const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Taskly — Kanban project management",
    template: "%s · Taskly",
  },
  description: DESCRIPTION,
  applicationName: "Taskly",
  keywords: ["kanban", "project management", "task board", "to-do", "productivity"],
  // What link previews show (the picture comes from opengraph-image.tsx).
  openGraph: {
    type: "website",
    siteName: "Taskly",
    title: "Taskly — Kanban project management",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Taskly — Kanban project management",
    description: DESCRIPTION,
  },
};

/** Colours the phone's browser bar to match the page (light and dark). */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6f0" },
    { media: "(prefers-color-scheme: dark)", color: "#16100c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
      // The theme script adds data-theme="dark|light" before React loads,
      // so React must not complain that <html> looks different.
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground transition-colors duration-300">
        {/* Each group of pages adds its own header: see (public)/layout.tsx and (app)/layout.tsx */}
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
