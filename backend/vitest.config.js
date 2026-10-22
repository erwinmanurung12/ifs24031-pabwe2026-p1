import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", coverage: { provider: "v8", include: ["src/app.js", "src/standings.js", "src/db.js"] } },
});
