import type { MetadataRoute } from "next";

/** Lets phones "Add to Home Screen" with Taskly's name, icon and colours. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Taskly",
    short_name: "Taskly",
    description: "Organize projects and move tasks across a Kanban board.",
    start_url: "/projects",
    display: "standalone",
    background_color: "#faf6f0",
    theme_color: "#8b5a3c",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
