import { describe, expect, it } from "vitest";

import { localeIds } from "@/config/locales";
import { findPublicPagesErrors, publicPages } from "@/config/public-pages";

describe("public page list", () => {
  it("is valid as shipped and contains only the home page in P1", () => {
    expect(findPublicPagesErrors(publicPages, localeIds)).toEqual([]);
    expect(publicPages.map((page) => page.path)).toEqual(["/"]);
  });

  it("rejects duplicates, locale-prefixed and malformed paths, and a missing home page", () => {
    expect(
      findPublicPagesErrors(
        [
          { path: "/about" },
          { path: "/about" },
          { path: "/ja/about" },
          { path: "about/" },
          { path: "/About" },
        ],
        localeIds,
      ),
    ).toEqual([
      expect.stringContaining('"/about" is listed twice'),
      expect.stringContaining(
        '"/ja/about" must not start with a locale prefix',
      ),
      expect.stringContaining('"about/" must be absolute'),
      expect.stringContaining('"/About" must be absolute'),
      expect.stringContaining('home page "/" must be listed'),
    ]);
  });
});
