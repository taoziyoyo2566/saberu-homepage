import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import { config } from "@/proxy";

function runsProxy(path: string): boolean {
  return unstable_doesMiddlewareMatch({
    config,
    url: `https://saberu.com${path}`,
  });
}

describe("proxy matcher", () => {
  it("runs for documents, so unknown paths get the 404 document", () => {
    for (const path of [
      "/",
      "/zh",
      "/ja/missing",
      "/about",
      "/fr",
      "/zh/opengraph-image",
    ]) {
      expect(runsProxy(path), path).toBe(true);
    }
  });

  it("skips Next.js internals, the exact health and icon routes, and files", () => {
    for (const path of [
      "/_next/static/chunks/app.js",
      "/healthz",
      "/apple-icon",
      "/sitemap.xml",
      "/robots.txt",
      "/icon.svg",
      "/missing.png",
    ]) {
      expect(runsProxy(path), path).toBe(false);
    }
  });

  it("anchors its exclusions to whole routes", () => {
    for (const path of [
      "/healthz-status",
      "/healthz/x",
      "/apple-icon/large",
      "/_nextx",
    ]) {
      expect(runsProxy(path), path).toBe(true);
    }
  });
});
