import { describe, expect, it } from "vitest";

import {
  countryFallbacks,
  defaultLocale,
  findLocaleConfigErrors,
  getLocaleDefinition,
  isLocale,
  localeIds,
  locales,
  type LocaleConfig,
} from "@/config/locales";

const valid: LocaleConfig = { locales, defaultLocale, countryFallbacks };

describe("locale registry", () => {
  it("is valid as shipped", () => {
    expect(findLocaleConfigErrors(valid)).toEqual([]);
    expect(localeIds).toEqual(["zh", "en", "ja"]);
    expect(getLocaleDefinition("zh").tag).toBe("zh-Hans");
  });

  it("recognises only registered ids", () => {
    expect(isLocale("ja")).toBe(true);
    expect(isLocale("JA")).toBe(false);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});

describe("findLocaleConfigErrors", () => {
  it("rejects duplicate ids", () => {
    const errors = findLocaleConfigErrors({
      ...valid,
      locales: [
        ...locales,
        {
          id: "en",
          tag: "en",
          label: "English",
          englishName: "English",
          ogLocale: "en_US",
        },
      ],
    });
    expect(errors).toEqual([
      expect.stringContaining('"en" is registered twice'),
    ]);
  });

  it("rejects an unregistered default locale", () => {
    expect(findLocaleConfigErrors({ ...valid, defaultLocale: "fr" })).toEqual([
      expect.stringContaining('default locale "fr" is not registered'),
    ]);
  });

  it("rejects fallback targets that are not registered and malformed country codes", () => {
    const errors = findLocaleConfigErrors({
      ...valid,
      countryFallbacks: { CN: "zh", TW: "zh-hant", jp: "ja" },
    });
    expect(errors).toEqual([
      expect.stringContaining('"TW" maps to unregistered locale "zh-hant"'),
      expect.stringContaining(
        'country code "jp" must be two uppercase letters',
      ),
    ]);
  });

  it("rejects malformed ids and incomplete definitions", () => {
    const errors = findLocaleConfigErrors({
      ...valid,
      locales: [
        { id: "ZH", tag: "", label: "x", englishName: "x", ogLocale: "zh-CN" },
        ...locales,
      ],
    });
    expect(errors).toEqual([
      expect.stringContaining('locale id "ZH" must be lowercase'),
      expect.stringContaining('locale "ZH" needs a tag'),
      expect.stringContaining('locale "ZH" needs an ogLocale'),
    ]);
  });

  it("rejects an empty registry", () => {
    expect(
      findLocaleConfigErrors({
        locales: [],
        defaultLocale: "en",
        countryFallbacks: {},
      }),
    ).toEqual([
      expect.stringContaining("at least one locale"),
      expect.stringContaining('default locale "en" is not registered'),
    ]);
  });
});
