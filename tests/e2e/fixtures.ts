import { createTranslator } from "next-intl";

import {
  getLocaleDefinition,
  localeIds,
  preferenceCookie,
  type Locale,
} from "@/config/locales";
import { site } from "@/config/site";

import en from "../../messages/en.json";
import ja from "../../messages/ja.json";
import zh from "../../messages/zh.json";

/** Expected copy comes from the same catalogs the app renders. */
export const copy = { zh, en, ja } satisfies Record<Locale, typeof en>;

/**
 * Visible text of the hero title. Its `<em>` tag only styles the words, so
 * next-intl renders the message with the tag reduced to its contents.
 */
export function heroTitleText(locale: Locale): string {
  const t = createTranslator({
    locale,
    messages: copy[locale],
    namespace: "home.hero",
  });
  return t.markup("title", { em: (chunks) => chunks });
}

/** Visible name of a language in the switcher. */
export function languageLabel(locale: Locale): string {
  return getLocaleDefinition(locale).label;
}

export const preferenceCookieName = preferenceCookie.name;
export { localeIds };
export { site };
