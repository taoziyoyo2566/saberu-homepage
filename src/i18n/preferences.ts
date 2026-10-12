/**
 * The explicit language preference: a host-only cookie written by the language
 * switcher and read by the root-path proxy. Visiting a language page never
 * writes it, so a shared `/ja` link cannot override a chosen `zh`.
 */
import { isLocale, preferenceCookie, type Locale } from "@/config/locales";

export function readPreference(raw: string | null | undefined): Locale | null {
  return isLocale(raw) ? raw : null;
}

export interface PreferenceCookieOptions {
  /** Add `Secure`; true under HTTPS, false only for plain-HTTP local checks. */
  readonly secure: boolean;
}

/** Serialises the preference for `document.cookie` or a `Set-Cookie` header. */
export function serializePreferenceCookie(
  locale: Locale,
  options: PreferenceCookieOptions,
): string {
  const attributes = [
    `${preferenceCookie.name}=${locale}`,
    `Max-Age=${preferenceCookie.maxAgeSeconds}`,
    "Path=/",
    "SameSite=Lax",
  ];
  if (options.secure) {
    attributes.push("Secure");
  }
  return attributes.join("; ");
}
