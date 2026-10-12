/**
 * Single source of truth for the languages the site serves and for the
 * root-path negotiation policy. next-intl routing, the proxy, the language
 * switcher, metadata and the sitemap all derive from this file.
 */

export interface LocaleDefinition {
  /** URL segment and message file name: `/zh`, `messages/zh.json`. */
  readonly id: string;
  /** BCP 47 tag used for `html lang`, hreflang and sitemap alternates. */
  readonly tag: string;
  /** Name of the language written in that language, shown in the switcher. */
  readonly label: string;
  /** English name, used for accessibility labels and by maintainers. */
  readonly englishName: string;
  /** Open Graph locale (`language_TERRITORY`), e.g. for `og:locale`. */
  readonly ogLocale: string;
}

export const locales = [
  {
    id: "zh",
    tag: "zh-Hans",
    label: "简体中文",
    englishName: "Simplified Chinese",
    ogLocale: "zh_CN",
  },
  {
    id: "en",
    tag: "en",
    label: "English",
    englishName: "English",
    ogLocale: "en_US",
  },
  {
    id: "ja",
    tag: "ja",
    label: "日本語",
    englishName: "Japanese",
    ogLocale: "ja_JP",
  },
] as const satisfies readonly LocaleDefinition[];

export type Locale = (typeof locales)[number]["id"];

export const localeIds: readonly Locale[] = locales.map((locale) => locale.id);

export const defaultLocale: Locale = "en";

/**
 * Country → locale fallback, consulted only when the browser expressed no
 * usable language. Deliberately short: a missing entry means "do not guess".
 */
export const countryFallbacks: Readonly<Partial<Record<string, Locale>>> = {
  CN: "zh",
  JP: "ja",
};

/** Written only by an explicit language choice, never by merely visiting a page. */
export const preferenceCookie = {
  name: "SABERU_LOCALE",
  maxAgeSeconds: 365 * 24 * 60 * 60,
} as const;

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (localeIds as readonly string[]).includes(value)
  );
}

export function getLocaleDefinition(id: Locale): LocaleDefinition {
  const definition = locales.find((locale) => locale.id === id);
  if (!definition) {
    throw new Error(`Locale "${id}" is not registered`);
  }
  return definition;
}

export interface LocaleConfig {
  readonly locales: readonly LocaleDefinition[];
  readonly defaultLocale: string;
  readonly countryFallbacks: Readonly<Partial<Record<string, string>>>;
}

const LOCALE_ID_PATTERN = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/;
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
const OG_LOCALE_PATTERN = /^[a-z]{2,3}_[A-Z]{2}$/;

/** Lists every defect in a locale configuration; an empty list means valid. */
export function findLocaleConfigErrors(config: LocaleConfig): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  if (config.locales.length === 0) {
    errors.push("at least one locale must be registered");
  }
  for (const locale of config.locales) {
    if (!LOCALE_ID_PATTERN.test(locale.id)) {
      errors.push(
        `locale id "${locale.id}" must be lowercase letters such as "zh" or "zh-hant"`,
      );
    }
    if (ids.has(locale.id)) {
      errors.push(`locale id "${locale.id}" is registered twice`);
    }
    ids.add(locale.id);
    if (!locale.tag || !locale.label || !locale.englishName) {
      errors.push(
        `locale "${locale.id}" needs a tag, a label and an englishName`,
      );
    }
    if (!OG_LOCALE_PATTERN.test(locale.ogLocale)) {
      errors.push(`locale "${locale.id}" needs an ogLocale such as "en_US"`);
    }
  }
  if (!ids.has(config.defaultLocale)) {
    errors.push(`default locale "${config.defaultLocale}" is not registered`);
  }
  for (const [country, target] of Object.entries(config.countryFallbacks)) {
    if (!COUNTRY_CODE_PATTERN.test(country)) {
      errors.push(`country code "${country}" must be two uppercase letters`);
    }
    if (target === undefined || !ids.has(target)) {
      errors.push(
        `country "${country}" maps to unregistered locale "${String(target)}"`,
      );
    }
  }
  return errors;
}

export function assertLocaleConfig(config: LocaleConfig): void {
  const errors = findLocaleConfigErrors(config);
  if (errors.length > 0) {
    throw new Error(`Invalid locale configuration:\n- ${errors.join("\n- ")}`);
  }
}

// Failing at import time makes `next build` stop on a broken registry instead
// of silently serving a wrong language.
assertLocaleConfig({ locales, defaultLocale, countryFallbacks });
