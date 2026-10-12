import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../", import.meta.url));

function markdownFiles(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(join(root, path)).isDirectory()) {
      return markdownFiles(path);
    }
    return name.endsWith(".md") ? [path] : [];
  });
}

describe("agent entry files", () => {
  it("CLAUDE.md only imports AGENTS.md, which exists", () => {
    // Claude Code loads CLAUDE.md, not AGENTS.md; this adapter keeps one owner.
    expect(readFileSync(join(root, "CLAUDE.md"), "utf8")).toBe("@AGENTS.md\n");
    expect(existsSync(join(root, "AGENTS.md"))).toBe(true);
  });
});

describe("documentation links", () => {
  const files = [
    "README.md",
    "AGENTS.md",
    "SECURITY.md",
    ...markdownFiles("docs"),
  ];

  it("resolve to files in the repository", () => {
    const broken: string[] = [];
    for (const file of files) {
      const text = readFileSync(join(root, file), "utf8");
      for (const match of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        const target = match[1].split("#")[0];
        if (target === "" || /^[a-z]+:/i.test(target)) {
          continue;
        }
        const resolved = join(root, dirname(file), decodeURIComponent(target));
        if (!existsSync(resolved)) {
          broken.push(`${file} -> ${target} (${relative(root, resolved)})`);
        }
      }
    }
    expect(broken).toEqual([]);
  });
});
