import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project additions: local scratch space, test artefacts, and Git-ignored
    // deployment material such as recovery copies of live configuration.
    "tmp/**",
    "test-results/**",
    "playwright-report/**",
    "deploy/**",
  ]),
]);

export default eslintConfig;
