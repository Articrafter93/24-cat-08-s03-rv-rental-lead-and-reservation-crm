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
    alias: {
      // Mirror the `@/*` → project-root alias used across the app.
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // Next resolves "server-only" itself (it is not an installed package). Tests run on the server
      // side, so it maps to Next's own empty module, as Next does for server code.
      "server-only": fileURLToPath(new URL("./node_modules/next/dist/compiled/server-only/empty.js", import.meta.url)),
    },
  },
});
