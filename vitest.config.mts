import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Behavior-focused unit tests for the core logic (voice FSM, anti-troll guard,
// NLU extractors, lead classification). Pure modules → node environment, no jsdom.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    // Mirror the `@/*` → project-root alias used across the app.
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
});
