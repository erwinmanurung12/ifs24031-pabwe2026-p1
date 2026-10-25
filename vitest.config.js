import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Konfigurasi uji untuk root repo (dipakai Jenkins: `npx vitest run --coverage`).
// Frontend diuji di jsdom, backend (src/backend) di node.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    environmentMatchGlobs: [["src/backend/**", "node"]],
    include: ["src/**/*.test.{js,jsx}"],
    setupFiles: ["./src/setupTests.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**"],
      exclude: [
        "src/main.jsx",
        "src/setupTests.js",
        "src/test-utils.jsx",
        "**/*.test.*",
      ],
    },
  },
});
