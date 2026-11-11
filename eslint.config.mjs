import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The session key is inlined at build time into whatever file reads it. Only the server-only
  // module may read it (and next.config.ts, which generates it), so it cannot end up in a client bundle.
  // Tests are never bundled, so they may read it to check how it is generated.
  {
    files: ["**/*.{ts,tsx,mts,js,jsx,mjs,cjs}"],
    ignores: ["lib/auth/session-key.ts", "next.config.ts", "**/*.test.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.object.name='process'][object.property.name='env'][property.name='DEMO_SESSION_SECRET']",
          message: "Read the session key only through lib/auth/session-key.ts, which is server-only.",
        },
        {
          selector:
            "MemberExpression[object.object.name='process'][object.property.name='env'][computed=true][property.value='DEMO_SESSION_SECRET']",
          message: "Read the session key only through lib/auth/session-key.ts, which is server-only.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
