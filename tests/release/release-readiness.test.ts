import { describe, expect, it } from "vitest";

import { findSiteReleaseErrors, site } from "@/config/site";

/**
 * Release gate (P3): run with `npm run release:check` before a candidate image
 * is promoted. It fails while the site content is placeholder or demo copy.
 */
describe("release readiness", () => {
  it("has confirmed, complete site content", () => {
    expect(findSiteReleaseErrors(site)).toEqual([]);
  });
});
