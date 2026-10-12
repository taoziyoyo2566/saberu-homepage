import { defineRouting } from "next-intl/routing";

import { defaultLocale, localeIds } from "@/config/locales";

/**
 * next-intl routing derived from the locale registry. Detection, the library
 * cookie and HTTP alternate links are off on purpose: `proxy.ts` negotiates the
 * root path, the explicit preference lives in the `SABERU_LOCALE` cookie, and
 * HTML metadata is the single place that declares language alternates.
 */
export const routing = defineRouting({
  locales: localeIds,
  defaultLocale,
  localePrefix: "always",
  localeDetection: false,
  localeCookie: false,
  alternateLinks: false,
});
