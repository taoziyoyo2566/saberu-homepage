import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Path aliases (`@/…`) come from tsconfig.json, their single source.
  resolve: { tsconfigPaths: true },
  test: {
    // next-intl's ESM build imports `next/server` and `next/navigation` without
    // an extension, which Node cannot resolve when the package is externalized.
    server: { deps: { inline: ["next-intl"] } },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          include: ["tests/component/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["tests/component/setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "release",
          include: ["tests/release/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
  },
});
