import { describe, expect, it } from "vitest";

import {
  collectAdvisories,
  dependencyPaths,
  evaluateAudit,
  productionNodes,
} from "../../scripts/audit-policy.mjs";

const braces = {
  source: 1240992,
  name: "braces",
  dependency: "braces",
  title: "braces vulnerable to stack-exhaustion denial of service",
  url: "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm",
  severity: "high",
  range: "<=3.0.3",
};

const PATH =
  "eslint-config-next>@next/eslint-plugin-next>fast-glob>micromatch>braces";

function entry(via: unknown[], effects: string[], isDirect = false) {
  return { via, effects, isDirect };
}

function report(vulnerabilities: Record<string, unknown>) {
  return { auditReportVersion: 2, vulnerabilities, metadata: {} };
}

const clean = report({});
const lintChain = {
  braces: entry([braces], ["micromatch"]),
  micromatch: entry(["braces"], ["fast-glob"]),
  "fast-glob": entry(["micromatch"], ["@next/eslint-plugin-next"]),
  "@next/eslint-plugin-next": entry(["fast-glob"], ["eslint-config-next"]),
  "eslint-config-next": entry(["@next/eslint-plugin-next"], [], true),
};
const devOnly = report(lintChain);

const exception = {
  advisory: "GHSA-vfj7-8cjw-p6xm",
  package: "braces",
  paths: [PATH],
  scope: "dev",
  reason:
    "Only reached by the lint toolchain on repository-owned glob patterns.",
  blocker: "No patched release exists.",
  owner: "operator",
  reviewBy: "2027-01-12",
};
const exceptions = { exceptions: [exception] };
const today = "2026-10-12";
/** A lockfile in which the reports above reach no production package. */
const lockfile = { lockfileVersion: 3, packages: { "": {} } };

describe("collectAdvisories and dependencyPaths", () => {
  it("lists each advisory once per package with every chain from a direct dependency", () => {
    expect(collectAdvisories(devOnly)).toEqual([
      expect.objectContaining({
        advisory: "GHSA-vfj7-8cjw-p6xm",
        package: "braces",
        paths: [PATH],
      }),
    ]);
  });

  it("finds every path when a package is reached more than once", () => {
    const twoParents = {
      ...lintChain,
      micromatch: entry(["braces"], ["fast-glob", "chokidar"]),
      chokidar: entry(["micromatch"], [], true),
    };
    expect(dependencyPaths(twoParents, "braces")).toEqual([
      "chokidar>micromatch>braces",
      PATH,
    ]);
  });

  it("refuses an npm error report instead of treating it as clean", () => {
    expect(() => collectAdvisories({ error: { code: "ENOTFOUND" } })).toThrow(
      /did not return a report/,
    );
    expect(() => collectAdvisories({})).toThrow(/no vulnerabilities map/);
  });
});

describe("evaluateAudit", () => {
  it("passes clean reports", () => {
    expect(
      evaluateAudit({
        lockfile,
        production: clean,
        full: clean,
        exceptions: { exceptions: [] },
        today,
      }).ok,
    ).toBe(true);
  });

  it("accepts a development-only advisory covered by an unexpired, path-scoped exception", () => {
    const outcome = evaluateAudit({
      lockfile,
      production: clean,
      full: devOnly,
      exceptions,
      today,
    });
    expect(outcome.ok).toBe(true);
    expect(outcome.accepted).toEqual([
      expect.objectContaining({ package: "braces", reviewBy: "2027-01-12" }),
    ]);
    expect(outcome.stale).toEqual([]);
  });

  it("fails a development-only advisory without an exception", () => {
    const outcome = evaluateAudit({
      lockfile,
      production: clean,
      full: devOnly,
      exceptions: { exceptions: [] },
      today,
    });
    expect(outcome.errors).toEqual([
      expect.stringContaining("without an exception"),
    ]);
  });

  it("fails when the advisory reaches the package through a path that was not accepted", () => {
    const newPath = report({
      ...lintChain,
      micromatch: entry(["braces"], ["fast-glob", "chokidar"]),
      chokidar: entry(["micromatch"], [], true),
    });
    const outcome = evaluateAudit({
      lockfile,
      production: clean,
      full: newPath,
      exceptions,
      today,
    });
    expect(outcome.errors).toEqual([
      expect.stringContaining("unaccepted paths: chokidar>micromatch>braces"),
    ]);
  });

  it("stops applying when npm reports no dependency path to check", () => {
    const orphan = report({ braces: entry([braces], []) });
    const outcome = evaluateAudit({
      lockfile,
      production: clean,
      full: orphan,
      exceptions,
      today,
    });
    expect(outcome.errors).toEqual([
      expect.stringContaining("no dependency path"),
    ]);
  });

  it("stops applying once a fix without a major upgrade is available", () => {
    for (const fixAvailable of [
      true,
      { name: "eslint-config-next", version: "16.4.1", isSemVerMajor: false },
    ]) {
      const fixable = report({
        ...lintChain,
        braces: { ...entry([braces], ["micromatch"]), fixAvailable },
      });
      const outcome = evaluateAudit({
        lockfile,
        production: clean,
        full: fixable,
        exceptions,
        today,
      });
      expect(outcome.errors).toEqual([
        expect.stringContaining("update the dependency"),
      ]);
    }
  });

  it("keeps the exception when the only fix npm offers is a major change", () => {
    const majorOnly = report({
      ...lintChain,
      braces: {
        ...entry([braces], ["micromatch"]),
        fixAvailable: {
          name: "eslint-config-next",
          version: "14.2.35",
          isSemVerMajor: true,
        },
      },
    });
    expect(
      evaluateAudit({
        lockfile,
        production: clean,
        full: majorOnly,
        exceptions,
        today,
      }).ok,
    ).toBe(true);
  });

  it("fails once the exception has expired", () => {
    const outcome = evaluateAudit({
      lockfile,
      production: clean,
      full: devOnly,
      exceptions,
      today: "2027-01-13",
    });
    expect(outcome.errors).toEqual([
      expect.stringContaining("expired on 2027-01-12"),
    ]);
  });

  it("never accepts an advisory that reaches production dependencies", () => {
    const outcome = evaluateAudit({
      lockfile,
      production: devOnly,
      full: devOnly,
      exceptions,
      today,
    });
    expect(outcome.ok).toBe(false);
    expect(outcome.errors).toEqual([
      expect.stringContaining("production dependency braces"),
    ]);
  });

  it("rejects malformed exceptions, including production scope", () => {
    const outcome = evaluateAudit({
      lockfile,
      production: clean,
      full: clean,
      exceptions: {
        exceptions: [
          {
            advisory: "CVE-2026-1",
            package: "",
            paths: [],
            scope: "prod",
            reason: "ok",
            reviewBy: "soon",
          },
        ],
      },
      today,
    });
    expect(outcome.errors).toEqual([
      expect.stringContaining("GHSA id"),
      expect.stringContaining("package is required"),
      expect.stringContaining("paths must list"),
      expect.stringContaining('scope must be "dev"'),
      expect.stringContaining("reason"),
      expect.stringContaining("owner"),
      expect.stringContaining("blocker"),
      expect.stringContaining("reviewBy"),
    ]);
    expect(
      evaluateAudit({
        lockfile,
        production: clean,
        full: clean,
        exceptions: {},
        today,
      }).errors,
    ).toEqual([expect.stringContaining('"exceptions" array')]);
  });

  it("reports exceptions and paths that no longer match without failing", () => {
    const gone = evaluateAudit({
      lockfile,
      production: clean,
      full: clean,
      exceptions,
      today,
    });
    expect(gone.ok).toBe(true);
    expect(gone.stale).toEqual([
      expect.stringContaining("matches no current advisory"),
    ]);

    const extraPath = evaluateAudit({
      lockfile,
      production: clean,
      full: devOnly,
      exceptions: {
        exceptions: [{ ...exception, paths: [PATH, "old>braces"] }],
      },
      today,
    });
    expect(extraPath.ok).toBe(true);
    expect(extraPath.stale).toEqual([expect.stringContaining("old>braces")]);
  });
});

/**
 * Shape of this repository's lockfile: next names @playwright/test as an
 * optional peer, the root installs it as a devDependency, and sharp (an
 * optional dependency of next) brings semver into the runtime.
 */
const appLock = {
  lockfileVersion: 3,
  packages: {
    "": {
      dependencies: { next: "^16.4.0" },
      devDependencies: { "@playwright/test": "^1.64.0", tailwindcss: "^4" },
    },
    "node_modules/next": {
      dependencies: { postcss: "8.4.31", "styled-jsx": "5.1.6" },
      optionalDependencies: { sharp: "^0.34.5" },
      peerDependencies: { "@playwright/test": "^1.51.1", react: "^19.0.0" },
      peerDependenciesMeta: { "@playwright/test": { optional: true } },
    },
    "node_modules/next/node_modules/postcss": {},
    "node_modules/postcss": { dev: true },
    "node_modules/styled-jsx": {},
    "node_modules/react": { peer: true },
    "node_modules/sharp": {
      optional: true,
      dependencies: { semver: "^7.7.3" },
    },
    "node_modules/semver": { devOptional: true },
    "node_modules/tailwindcss": { dev: true, dependencies: { postcss: "^8" } },
    "node_modules/@playwright/test": {
      devOptional: true,
      dependencies: { playwright: "1.64.0" },
    },
    "node_modules/playwright": {
      devOptional: true,
      dependencies: { "playwright-core": "1.64.0" },
    },
    "node_modules/playwright-core": { devOptional: true },
  },
};

const advisory = (name: string, id: string) => ({
  name,
  title: `${name} test advisory`,
  url: `https://github.com/advisories/${id}`,
  severity: "high",
});

describe("productionNodes", () => {
  it("follows dependencies, optional dependencies and required peers only", () => {
    expect([...productionNodes(appLock)].sort()).toEqual([
      "node_modules/next",
      "node_modules/next/node_modules/postcss",
      "node_modules/react",
      "node_modules/semver",
      "node_modules/sharp",
      "node_modules/styled-jsx",
    ]);
  });

  it("refuses a lockfile without a packages map", () => {
    expect(() => productionNodes({ lockfileVersion: 1 })).toThrow(
      /no packages map/,
    );
  });
});

describe("evaluateAudit with a production optional peer", () => {
  const playwrightAdvisory = advisory("playwright", "GHSA-aaaa-bbbb-cccc");
  const playwrightChain = {
    playwright: {
      ...entry([playwrightAdvisory], ["@playwright/test"]),
      nodes: ["node_modules/playwright"],
    },
    "@playwright/test": {
      ...entry(["playwright"], [], true),
      nodes: ["node_modules/@playwright/test"],
    },
  };
  const playwrightException = {
    ...exception,
    advisory: "GHSA-aaaa-bbbb-cccc",
    package: "playwright",
    paths: ["@playwright/test>playwright"],
  };

  it("judges a package reached only as an optional peer as development", () => {
    const both = report(playwrightChain);
    const missing = evaluateAudit({
      production: both,
      full: both,
      lockfile: appLock,
      exceptions: { exceptions: [] },
      today,
    });
    expect(missing.reclassified).toEqual([
      expect.objectContaining({ package: "playwright" }),
    ]);
    expect(missing.errors).toEqual([
      expect.stringContaining(
        "development dependency playwright has GHSA-aaaa-bbbb-cccc",
      ),
    ]);

    const covered = evaluateAudit({
      production: both,
      full: both,
      lockfile: appLock,
      exceptions: { exceptions: [playwrightException] },
      today,
    });
    expect(covered.ok).toBe(true);
    expect(covered.accepted).toEqual([
      expect.objectContaining({ package: "playwright" }),
    ]);
  });

  it("keeps a devOptional package that production reaches through a required edge", () => {
    const semver = report({
      semver: {
        ...entry([advisory("semver", "GHSA-dddd-eeee-ffff")], [], true),
        nodes: ["node_modules/semver"],
      },
    });
    const outcome = evaluateAudit({
      production: semver,
      full: semver,
      lockfile: appLock,
      exceptions,
      today,
    });
    expect(outcome.reclassified).toEqual([]);
    expect(outcome.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("production dependency semver"),
      ]),
    );
  });

  it("keeps an advisory production when npm names no node or an unknown one", () => {
    for (const nodes of [[], ["node_modules/unknown"]]) {
      const unknown = report({
        playwright: { ...playwrightChain.playwright, nodes },
        "@playwright/test": playwrightChain["@playwright/test"],
      });
      const outcome = evaluateAudit({
        production: unknown,
        full: unknown,
        lockfile: appLock,
        exceptions: { exceptions: [playwrightException] },
        today,
      });
      expect(outcome.errors).toEqual([
        expect.stringContaining("production dependency playwright"),
      ]);
    }
  });
});
