import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3000, proxy: { "/api": "http://localhost:8000" } },
  preview: { port: 3000 },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    coverage: {
      provider: "v8",
      reporter: ["text"],
      include: ["src/**"],
      exclude: ["src/main.jsx", "src/setupTests.js", "src/test-utils.jsx", "src/**/*.test.*"],
    },
  },
});
