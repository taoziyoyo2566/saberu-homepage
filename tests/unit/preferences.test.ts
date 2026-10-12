import { describe, expect, it } from "vitest";

import { readPreference, serializePreferenceCookie } from "@/i18n/preferences";

describe("explicit language preference cookie", () => {
  it("carries the attributes the plan requires, with Secure under HTTPS", () => {
    expect(serializePreferenceCookie("ja", { secure: true })).toBe(
      "SABERU_LOCALE=ja; Max-Age=31536000; Path=/; SameSite=Lax; Secure",
    );
    expect(serializePreferenceCookie("zh", { secure: false })).toBe(
      "SABERU_LOCALE=zh; Max-Age=31536000; Path=/; SameSite=Lax",
    );
  });

  it("reads back only registered locales", () => {
    expect(readPreference("en")).toBe("en");
    for (const raw of ["EN", "fr", "", undefined, null, "en; Path=/"]) {
      expect(readPreference(raw)).toBeNull();
    }
  });
});
