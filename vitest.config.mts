import { defineConfig } from "vitest/config";

export default defineConfig({
  // Lets tests import files with "@/..." just like the app does.
  resolve: { tsconfigPaths: true },
  test: {
    // The tested code is plain logic, so no browser is needed.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
