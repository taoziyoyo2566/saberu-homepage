import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { brandColors } from "@/components/brand-mark";
import { renderNotFoundDocument } from "@/i18n/not-found-document";

import {
  hexToRgb,
  readThemeTokens,
  rootBlockAfter,
  tokensIn,
} from "../support/design-tokens";

/**
 * src/app/globals.css owns the colour tokens. Three carriers cannot read it
 * and repeat values: the proxy's 404 document (no stylesheet), the generated
 * images (no CSS at all) and the static icon. This test keeps them in step.
 */
const { light, dark } = readThemeTokens();
const shared = ["bg", "fg", "muted", "line", "accent"];

describe("design token copies", () => {
  it("are read from globals.css", () => {
    for (const name of shared) {
      expect(light[name], `light --${name}`).toMatch(/^#[0-9a-f]{6}$/);
      expect(dark[name], `dark --${name}`).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(hexToRgb("#0a6c86")).toBe("rgb(10, 108, 134)");
  });

  it("match in the proxy's 404 document", async () => {
    const html = await renderNotFoundDocument("en");
    const style = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));
    const docLight = tokensIn(rootBlockAfter(style, /:root\{/));
    const docDark = tokensIn(
      rootBlockAfter(style, /@media \(prefers-color-scheme:dark\)/),
    );
    for (const name of shared) {
      expect(docLight[name], `404 light --${name}`).toBe(light[name]);
      expect(docDark[name], `404 dark --${name}`).toBe(dark[name]);
    }
  });

  it("match in the brand mark, the generated images and the static icon", () => {
    expect(brandColors.accent).toBe(light.accent);
    expect(brandColors.ink).toBe(dark.bg);
    expect(brandColors.muted).toBe(dark.muted);
    const icon = readFileSync(
      new URL("../../src/app/icon.svg", import.meta.url),
      "utf8",
    );
    expect(icon).toContain(`fill="${light.accent}"`);
  });
});
