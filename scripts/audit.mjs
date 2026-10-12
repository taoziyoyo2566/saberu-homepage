#!/usr/bin/env node
/**
 * Dependency audit gate: `npm run audit:deps`. Needs network access to the npm
 * registry and reads package-lock.json; it does not need node_modules.
 * Policy: scripts/audit-policy.mjs.
 */
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

import { evaluateAudit } from "./audit-policy.mjs";

function npmAudit(args) {
  // --offline=false: an offline npm returns an empty, well-formed report.
  const result = spawnSync(
    "npm",
    ["audit", "--json", "--offline=false", ...args],
    {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  // npm audit exits non-zero whenever it finds advisories; the JSON decides.
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(
      `npm audit ${args.join(" ")} failed: ${result.stderr || result.stdout}`.trim(),
    );
  }
}

const readJson = async (name) =>
  JSON.parse(await readFile(new URL(`../${name}`, import.meta.url), "utf8"));
const exceptions = await readJson("audit-exceptions.json");
const lockfile = await readJson("package-lock.json");
const today = new Date().toISOString().slice(0, 10);
const outcome = evaluateAudit({
  production: npmAudit(["--omit=dev"]),
  // Explicit: NODE_ENV=production would otherwise omit dev dependencies silently.
  full: npmAudit(["--include=dev"]),
  lockfile,
  exceptions,
  today,
});

console.log(
  `production dependencies: ${outcome.productionAdvisories.length} advisories`,
);
for (const item of outcome.reclassified) {
  console.log(
    `  ${item.package} (${item.advisory}) counts as development: production packages name it only as an optional peer`,
  );
}
console.log(
  `development-only advisories: ${outcome.devOnly.length}, accepted: ${outcome.accepted.length}`,
);
for (const item of outcome.accepted) {
  console.log(
    `  accepted ${item.advisory} ${item.package} (${item.severity}) until ${item.reviewBy}, owner ${item.owner}`,
  );
  for (const path of item.paths) {
    console.log(`    via ${path}`);
  }
}
// In GitHub Actions a "::warning::" line becomes a visible annotation.
const notePrefix =
  process.env.GITHUB_ACTIONS === "true" ? "::warning::" : "  note: ";
for (const note of outcome.stale) {
  console.log(`${notePrefix}${note}; update audit-exceptions.json`);
}
if (!outcome.ok) {
  for (const error of outcome.errors) {
    console.error(`FAIL ${error}`);
  }
  process.exit(1);
}
console.log("audit policy: pass");
