import type { Metadata } from "next";
import { AppSettings } from "@/components/settings/AppSettings";

export const metadata: Metadata = { title: "Settings" };

/** /settings — app-wide options: theme, profile, your data. */
export default function SettingsPage() {
  return <AppSettings />;
}
