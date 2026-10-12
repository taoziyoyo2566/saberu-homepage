import { describe, expect, it } from "vitest";

import {
  matchBrowserLocale,
  negotiateLocale,
  negotiateSiteLocale,
  parseAcceptLanguage,
  sitePolicy,
  type NegotiationPolicy,
} from "@/i18n/negotiation";

const policy: NegotiationPolicy = {
  locales: [
    { id: "zh", tag: "zh-Hans" },
    { id: "en", tag: "en" },
    { id: "ja", tag: "ja" },
  ],
  defaultLocale: "en",
  countryFallbacks: { CN: "zh", JP: "ja" },
};

describe("parseAcceptLanguage", () => {
  it("orders ranges by quality and keeps header order among equal qualities", () => {
    expect(parseAcceptLanguage("en;q=0.8, ja, zh-CN;q=0.9, fr")).toEqual([
      { tag: "ja", quality: 1 },
      { tag: "fr", quality: 1 },
      { tag: "zh-cn", quality: 0.9 },
      { tag: "en", quality: 0.8 },
    ]);
  });

  it("drops q=0 entries and skips malformed ones", () => {
    expect(
      parseAcceptLanguage("en;q=0, ja;q=abc, <script>, fr ; q = 0.5"),
    ).toEqual([{ tag: "fr", quality: 0.5 }]);
  });

  it("returns an empty list for a missing or blank header", () => {
    expect(parseAcceptLanguage(undefined)).toEqual([]);
    expect(parseAcceptLanguage(null)).toEqual([]);
    expect(parseAcceptLanguage("   ")).toEqual([]);
  });

  it("never throws on garbage and clamps out-of-range qualities", () => {
    expect(() => parseAcceptLanguage(",,;;=;q=;;")).not.toThrow();
    expect(parseAcceptLanguage("*;q=1.5")).toEqual([{ tag: "*", quality: 1 }]);
    expect(parseAcceptLanguage("x".repeat(10_000))).toEqual([]);
  });
});

describe("matchBrowserLocale", () => {
  it("matches a locale id or BCP 47 tag exactly, then by primary subtag", () => {
    expect(
      matchBrowserLocale(parseAcceptLanguage("zh-TW"), policy.locales),
    ).toBe("zh");
    expect(
      matchBrowserLocale(parseAcceptLanguage("zh-Hans"), policy.locales),
    ).toBe("zh");
    expect(
      matchBrowserLocale(parseAcceptLanguage("en-GB"), policy.locales),
    ).toBe("en");
    expect(
      matchBrowserLocale(parseAcceptLanguage("ja-JP"), policy.locales),
    ).toBe("ja");
  });

  it("walks ranges in quality order", () => {
    expect(
      matchBrowserLocale(
        parseAcceptLanguage("fr, ja;q=0.7, en;q=0.9"),
        policy.locales,
      ),
    ).toBe("en");
  });

  it("treats a wildcard as no preference and reports no match instead of a default", () => {
    expect(
      matchBrowserLocale(parseAcceptLanguage("*"), policy.locales),
    ).toBeNull();
    expect(
      matchBrowserLocale(parseAcceptLanguage("fr, de;q=0.5"), policy.locales),
    ).toBeNull();
    expect(matchBrowserLocale([], policy.locales)).toBeNull();
  });
});

describe("negotiateLocale", () => {
  it("uses the browser language when there is no preference", () => {
    expect(negotiateLocale({ acceptLanguage: "ja-JP" }, policy)).toEqual({
      locale: "ja",
      source: "browser",
    });
  });

  it("prefers the browser language over a trusted country", () => {
    expect(
      negotiateLocale(
        { acceptLanguage: "zh-CN", country: "JP", countryTrusted: true },
        policy,
      ),
    ).toEqual({ locale: "zh", source: "browser" });
  });

  it("falls back to a trusted country only when the browser matched nothing", () => {
    expect(
      negotiateLocale(
        { acceptLanguage: "fr", country: "JP", countryTrusted: true },
        policy,
      ),
    ).toEqual({ locale: "ja", source: "country" });
  });

  it("ignores the country when the request is not trusted", () => {
    expect(
      negotiateLocale(
        { acceptLanguage: "fr", country: "JP", countryTrusted: false },
        policy,
      ),
    ).toEqual({ locale: "en", source: "default" });
    expect(
      negotiateLocale({ acceptLanguage: "fr", country: "JP" }, policy),
    ).toEqual({
      locale: "en",
      source: "default",
    });
  });

  it("ignores unknown, unmapped or special country values", () => {
    for (const country of ["XX", "T1", "US", "SG", "", "J", "JPN"]) {
      expect(
        negotiateLocale({ country, countryTrusted: true }, policy),
      ).toEqual({
        locale: "en",
        source: "default",
      });
    }
  });

  it("normalises the country code before matching", () => {
    expect(
      negotiateLocale({ country: " jp ", countryTrusted: true }, policy),
    ).toEqual({
      locale: "ja",
      source: "country",
    });
  });

  it("honours a valid preference above everything else", () => {
    expect(
      negotiateLocale(
        {
          preference: "zh",
          acceptLanguage: "ja",
          country: "JP",
          countryTrusted: true,
        },
        policy,
      ),
    ).toEqual({ locale: "zh", source: "preference" });
  });

  it("ignores an invalid preference value", () => {
    for (const preference of ["ZH", "fr", "", "zh;en", "../zh", "zh\n"]) {
      expect(
        negotiateLocale({ preference, acceptLanguage: "ja" }, policy),
      ).toEqual({
        locale: "ja",
        source: "browser",
      });
    }
  });

  it("does not let a q=0 entry act as a browser candidate", () => {
    expect(
      negotiateLocale(
        { acceptLanguage: "ja;q=0, fr", country: "JP", countryTrusted: true },
        policy,
      ),
    ).toEqual({ locale: "ja", source: "country" });
  });

  it("returns the default when nothing is known", () => {
    expect(negotiateLocale({}, policy)).toEqual({
      locale: "en",
      source: "default",
    });
    expect(negotiateLocale({ acceptLanguage: "\u0000￿;;;" }, policy)).toEqual({
      locale: "en",
      source: "default",
    });
  });
});

describe("negotiateSiteLocale", () => {
  it("derives its policy from the locale registry", () => {
    expect(sitePolicy.locales.map((locale) => locale.id)).toEqual([
      "zh",
      "en",
      "ja",
    ]);
    expect(sitePolicy.defaultLocale).toBe("en");
    expect(negotiateSiteLocale({ acceptLanguage: "ja" })).toEqual({
      locale: "ja",
      source: "browser",
    });
    expect(
      negotiateSiteLocale({ country: "CN", countryTrusted: true }),
    ).toEqual({
      locale: "zh",
      source: "country",
    });
  });
});
