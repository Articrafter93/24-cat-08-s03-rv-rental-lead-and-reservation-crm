import { randomBytes } from "node:crypto";
import type { NextConfig } from "next";

// Per-build key for the demo session cookie signature. Listed under `env` below, so Next replaces
// process.env.DEMO_SESSION_SECRET with this literal at compile time, in the only module that reads
// it: lib/auth/session-key.ts, which is server-only. It is deliberately not a NEXT_PUBLIC_ variable.
// The first load of this file generates it; later loads in the same build process see it in
// process.env and keep it. A value set in the build environment is used instead, but an empty or
// short one is not accepted: empty means "generate one", short stops the build.
const providedSessionKey = process.env.DEMO_SESSION_SECRET;
if (providedSessionKey && providedSessionKey.length < 32) {
  throw new Error("DEMO_SESSION_SECRET must be at least 32 characters long, or unset so the build generates one");
}
process.env.DEMO_SESSION_SECRET = providedSessionKey || randomBytes(32).toString("hex");

const nextConfig: NextConfig = {
  // typedRoutes removed — causes strict type errors with dynamic href strings
  env: {
    DEMO_SESSION_SECRET: process.env.DEMO_SESSION_SECRET,
  },
};

export default nextConfig;
