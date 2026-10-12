/**
 * Pure language negotiation for the root path. No Next.js imports, so it is
 * unit-tested directly and reusable by any entry point.
 */
import {
  countryFallbacks,
  defaultLocale,
  isLocale,
  locales,
  type Locale,
} from "@/config/locales";

export interface LanguageRange {
  /** Lowercased language range, for example `zh-tw` or `*`. */
  readonly tag: string;
  /** Quality value in (0, 1]. */
  readonly quality: number;
}

export interface LocaleCandidate {
  readonly id: string;
  readonly tag: string;
}

export interface NegotiationPolicy {
  readonly locales: readonly LocaleCandidate[];
  readonly defaultLocale: string;
  readonly countryFallbacks: Readonly<Partial<Record<string, string>>>;
}

export interface NegotiationInput {
  /** Raw value of the explicit-preference cookie, if present. */
  readonly preference?: string | null;
  /** Raw `Accept-Language` header, if present. */
  readonly acceptLanguage?: string | null;
  /** Raw `CF-IPCountry` value; ignored unless `countryTrusted` is true. */
  readonly country?: string | null;
  /** True only when the request provably arrived through the Cloudflare → Tunnel path. */
  readonly countryTrusted?: boolean;
}

export type NegotiationSource =
  "preference" | "browser" | "country" | "default";

export interface NegotiationResult {
  readonly locale: string;
  readonly source: NegotiationSource;
}

const LANGUAGE_RANGE_PATTERN = /^(\*|[a-z0-9]{1,8}(-[a-z0-9]{1,8})*)$/;
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
/** Bounds the work spent on an abusive header; browsers send far fewer entries. */
const MAX_RANGES = 50;

/**
 * Parses `Accept-Language` into ranges ordered by descending quality, keeping
 * header order among equal qualities. Malformed entries are skipped and
 * `q=0` entries are dropped because they mean "not acceptable" (RFC 9110).
 * Never throws.
 */
export function parseAcceptLanguage(
  header: string | null | undefined,
): LanguageRange[] {
  if (typeof header !== "string" || header.trim() === "") {
    return [];
  }
  const ranges: Array<LanguageRange & { readonly index: number }> = [];
  header
    .split(",")
    .slice(0, MAX_RANGES)
    .forEach((entry, index) => {
      const [rawTag = "", ...params] = entry.split(";");
      const tag = rawTag.trim().toLowerCase();
      if (!LANGUAGE_RANGE_PATTERN.test(tag)) {
        return;
      }
      let quality = 1;
      for (const param of params) {
        const [key = "", value = ""] = param.split("=");
        if (key.trim().toLowerCase() !== "q") {
          continue;
        }
        const parsed = Number(value.trim());
        quality = Number.isFinite(parsed)
          ? Math.min(Math.max(parsed, 0), 1)
          : 0;
      }
      if (quality > 0) {
        ranges.push({ tag, quality, index });
      }
    });
  return ranges
    .sort((a, b) => b.quality - a.quality || a.index - b.index)
    .map(({ tag, quality }) => ({ tag, quality }));
}

/**
 * Best-fit match of browser ranges against the supported locales: an exact
 * match of a locale id or BCP 47 tag wins, then a primary-subtag match
 * (`zh-tw` → `zh`, `en-gb` → `en`). A wildcard states no preference and never
 * selects a locale. Returns null when nothing matches so the caller continues
 * with the next negotiation step instead of defaulting early.
 */
export function matchBrowserLocale(
  ranges: readonly LanguageRange[],
  candidates: readonly LocaleCandidate[],
): string | null {
  for (const range of ranges) {
    if (range.tag === "*") {
      continue;
    }
    const exact = candidates.find(
      (candidate) =>
        candidate.id.toLowerCase() === range.tag ||
        candidate.tag.toLowerCase() === range.tag,
    );
    if (exact) {
      return exact.id;
    }
    const primary = range.tag.split("-")[0];
    const byPrimary = candidates.find(
      (candidate) =>
        candidate.id.toLowerCase() === primary ||
        candidate.tag.toLowerCase().split("-")[0] === primary,
    );
    if (byPrimary) {
      return byPrimary.id;
    }
  }
  return null;
}

/**
 * Root-path negotiation order: valid explicit preference → browser best fit →
 * trusted country fallback → default. Invalid or untrusted inputs are ignored
 * rather than rejected, so a damaged header can never produce an error page.
 */
export function negotiateLocale(
  input: NegotiationInput,
  policy: NegotiationPolicy,
): NegotiationResult {
  const ids = policy.locales.map((locale) => locale.id);
  if (typeof input.preference === "string" && ids.includes(input.preference)) {
    return { locale: input.preference, source: "preference" };
  }
  const browser = matchBrowserLocale(
    parseAcceptLanguage(input.acceptLanguage),
    policy.locales,
  );
  if (browser !== null) {
    return { locale: browser, source: "browser" };
  }
  if (input.countryTrusted === true && typeof input.country === "string") {
    const code = input.country.trim().toUpperCase();
    const target = COUNTRY_CODE_PATTERN.test(code)
      ? policy.countryFallbacks[code]
      : undefined;
    if (target !== undefined && ids.includes(target)) {
      return { locale: target, source: "country" };
    }
  }
  return { locale: policy.defaultLocale, source: "default" };
}

/** The site's negotiation policy, derived from the locale registry. */
export const sitePolicy: NegotiationPolicy = {
  locales,
  defaultLocale,
  countryFallbacks,
};

export interface SiteNegotiationResult {
  readonly locale: Locale;
  readonly source: NegotiationSource;
}

export function negotiateSiteLocale(
  input: NegotiationInput,
): SiteNegotiationResult {
  const result = negotiateLocale(input, sitePolicy);
  if (!isLocale(result.locale)) {
    // Unreachable with a validated registry; kept so a future policy bug fails loudly.
    throw new Error(`Negotiated unknown locale "${result.locale}"`);
  }
  return { locale: result.locale, source: result.source };
}
