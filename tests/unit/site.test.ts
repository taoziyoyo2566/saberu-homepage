import { describe, expect, it } from "vitest";

import { findSiteReleaseErrors, site, type SiteConfig } from "@/config/site";

const publishable: SiteConfig = {
  name: "saberu",
  url: "https://saberu.com",
  contactEmail: "contact@saberu.com",
  productUrl: null,
  links: [{ label: "GitHub", href: "https://github.com/example" }],
  contentStatus: "confirmed",
};

describe("site configuration release check", () => {
  it("ships the demo with the real mailbox and refuses to release it", () => {
    expect(site.contactEmail).toBe("contact@saberu.com");
    // Every canonical, hreflang, Open Graph and sitemap URL derives from this origin.
    expect(site.url).toBe("https://saberu.com");
    expect(findSiteReleaseErrors(site)).toEqual([
      expect.stringContaining('content status is "demo"'),
    ]);
  });

  it("releases only content confirmed by the brand owner", () => {
    for (const contentStatus of ["placeholder", "demo"] as const) {
      expect(
        findSiteReleaseErrors({ ...publishable, contentStatus }),
      ).toHaveLength(1);
    }
    expect(
      findSiteReleaseErrors({ ...publishable, contentStatus: "confirmed" }),
    ).toEqual([]);
  });

  it("accepts a complete configuration", () => {
    expect(findSiteReleaseErrors(publishable)).toEqual([]);
  });

  it("rejects a site url that is not a bare https origin", () => {
    expect(
      findSiteReleaseErrors({ ...publishable, url: "http://saberu.com" }),
    ).toHaveLength(1);
    expect(
      findSiteReleaseErrors({ ...publishable, url: "https://saberu.com/" }),
    ).toHaveLength(1);
    expect(
      findSiteReleaseErrors({ ...publishable, url: "https://saberu.com/zh" }),
    ).toHaveLength(1);
    expect(
      findSiteReleaseErrors({ ...publishable, url: "saberu.com" }),
    ).toHaveLength(1);
  });

  it("rejects missing, malformed or example mailboxes", () => {
    for (const contactEmail of ["", "hello", "hello@example.com", "a@b"]) {
      expect(
        findSiteReleaseErrors({ ...publishable, contactEmail }),
      ).toHaveLength(1);
    }
  });

  it("rejects non-https product and external links", () => {
    expect(
      findSiteReleaseErrors({
        ...publishable,
        productUrl: "http://app.saberu.com",
      }),
    ).toHaveLength(1);
    expect(
      findSiteReleaseErrors({
        ...publishable,
        links: [{ label: "", href: "javascript:alert(1)" }],
      }),
    ).toHaveLength(2);
  });
});
