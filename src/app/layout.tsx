import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: {
    default: "Taskly",
    template: "%s · Taskly",
  },
  description: "A project management app with a drag-and-drop Kanban board.",
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
