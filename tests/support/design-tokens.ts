import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Colour tokens read from src/app/globals.css, their single owner, so tests
 * and the mirrored copies are checked against it instead of repeating values.
 * Both Vitest and Playwright run from the repository root.
 */
export type Tokens = Record<string, string>;

/** `--name: value` pairs in a block of CSS. */
export function tokensIn(block: string): Tokens {
  return Object.fromEntries(
    [...block.matchAll(/--([a-z-]+):\s*([^;}\s]+)/g)].map((match) => [
      match[1],
      match[2],
    ]),
  );
}

/** The body of the first `:root { … }` at or after `marker`. */
export function rootBlockAfter(source: string, marker: RegExp): string {
  const start = source.search(marker);
  if (start < 0) {
    throw new Error(`${marker} not found`);
  }
  const open = source.indexOf("{", source.indexOf(":root", start));
  return source.slice(open, source.indexOf("}", open));
}

export function readThemeTokens(): { light: Tokens; dark: Tokens } {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
  return {
    light: tokensIn(rootBlockAfter(css, /^:root\s*\{/m)),
    dark: tokensIn(
      rootBlockAfter(css, /@media \(prefers-color-scheme: ?dark\)/),
    ),
  };
}

/** `#0a6c86` → `rgb(10, 108, 134)`, the form getComputedStyle returns. */
export function hexToRgb(hex: string): string {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) {
    throw new Error(`not a #rrggbb colour: ${hex}`);
  }
  const [r, g, b] = match.slice(1).map((part) => Number.parseInt(part, 16));
  return `rgb(${r}, ${g}, ${b})`;
}
