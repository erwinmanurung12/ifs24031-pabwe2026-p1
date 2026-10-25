import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Konfigurasi uji untuk root repo (dipakai Jenkins: `npx vitest run --coverage`).
// Menjalankan uji frontend (jsdom) dan backend (node) sekaligus.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    environmentMatchGlobs: [["frontend/**", "jsdom"]],
    include: ["frontend/src/**/*.test.{js,jsx}", "backend/tests/**/*.test.js"],
    setupFiles: ["./frontend/src/setupTests.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: ["frontend/src/**", "backend/src/**"],
      exclude: [
        "frontend/src/main.jsx",
        "frontend/src/setupTests.js",
        "frontend/src/test-utils.jsx",
        "backend/src/server.js",
        "**/*.test.*",
      ],
    },
  },
});
