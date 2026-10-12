import { locale as rootLocale } from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "@/i18n/routing";

/**
 * Resolves the locale for next-intl's server APIs. An explicit `locale`
 * argument (for example `getTranslations({locale})`) wins; otherwise the
 * `[locale]` root parameter is used. An unsupported value falls back to the
 * default locale so an error page for an unknown prefix still renders.
 */
export default getRequestConfig(async ({ locale: requestedLocale }) => {
  const candidate = requestedLocale ?? (await rootLocale());
  const locale = hasLocale(routing.locales, candidate)
    ? candidate
    : routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
