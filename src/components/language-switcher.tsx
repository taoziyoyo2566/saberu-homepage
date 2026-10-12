"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, type MouseEvent } from "react";

import { locales, type Locale } from "@/config/locales";
import { getPathname, Link, usePathname } from "@/i18n/navigation";
import { serializePreferenceCookie } from "@/i18n/preferences";

interface ScrollIntent {
  readonly y: number;
  readonly hash: string;
}

// Changing the locale segment swaps the whole layout tree: Cache Components
// hide the previous tree with React's <Activity> (it stays in the DOM, so ids
// repeat) and mount the new one, or reveal a preserved one, first in document
// order. With `scroll: false` the browser does not move to the fragment, and
// keeping the position is up to the engine. The intent waits here, outside
// React, until the switcher in the visible tree runs its effect and honours it.
let pendingScroll: ScrollIntent | null = null;

function rememberPreference(locale: Locale): void {
  document.cookie = serializePreferenceCookie(locale, {
    secure: window.location.protocol === "https:",
  });
}

function rememberScrollIntent(): void {
  pendingScroll = { y: window.scrollY, hash: window.location.hash };
}

/** Element id named by a URL fragment; a malformed escape is kept as written. */
function fragmentId(hash: string): string {
  const raw = hash.slice(1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function restoreScrollIntent(): void {
  if (pendingScroll === null) {
    return;
  }
  const { y, hash } = pendingScroll;
  pendingScroll = null;
  const target =
    hash.length > 1 ? document.getElementById(fragmentId(hash)) : null;
  if (target) {
    target.scrollIntoView({ block: "start" });
  } else {
    window.scrollTo(0, y);
  }
}

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    !event.defaultPrevented
  );
}

/**
 * Real links to the same page in every language, so switching works without
 * JavaScript. With JavaScript, a plain click also records the explicit
 * preference and replaces the current history entry, keeping query, hash and
 * scroll position.
 */
export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("languageSwitcher");

  useEffect(() => {
    restoreScrollIntent();
  }, [currentLocale]);

  function choose(event: MouseEvent<HTMLAnchorElement>, locale: Locale) {
    if (!isPlainLeftClick(event)) {
      return;
    }
    event.preventDefault();
    rememberPreference(locale);
    rememberScrollIntent();
    const { search, hash } = window.location;
    router.replace(
      `${getPathname({ href: pathname, locale })}${search}${hash}`,
      {
        scroll: false,
      },
    );
  }

  return (
    <nav aria-label={t("label")}>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
        {locales.map((entry) => {
          const isCurrent = entry.id === currentLocale;
          return (
            <li key={entry.id}>
              <Link
                href={pathname}
                locale={entry.id}
                hrefLang={entry.tag}
                lang={entry.tag}
                aria-current={isCurrent ? "true" : undefined}
                onClick={(event) => choose(event, entry.id)}
                className={
                  isCurrent
                    ? "font-semibold text-accent underline underline-offset-4"
                    : "text-muted hover:text-accent"
                }
              >
                {entry.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
