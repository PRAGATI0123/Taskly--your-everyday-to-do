import type { Metadata } from "next";
import { ProjectsDashboard } from "@/components/project/ProjectsDashboard";

export const metadata: Metadata = { title: "Projects" };

/** /projects — the dashboard listing every project. */
export default function ProjectsPage() {
  return <ProjectsDashboard />;
}
