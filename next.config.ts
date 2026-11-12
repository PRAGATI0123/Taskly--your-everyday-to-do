import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Taskly's data lives in the browser (IndexedDB), so app pages show a
    // loader on the server on purpose. Only check "instant navigation" on
    // pages that ask for it with `export const instant = true`.
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
  turbopack: {
    // Tell Next.js that THIS folder is the project root
    // (there is another package-lock.json higher up on the Desktop).
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
