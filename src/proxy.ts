import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import {
  defaultLocale,
  isLocale,
  preferenceCookie,
  type Locale,
} from "@/config/locales";
import { publicPages } from "@/config/public-pages";
import { negotiateSiteLocale } from "@/i18n/negotiation";
import { renderNotFoundDocument } from "@/i18n/not-found-document";
import { routing } from "@/i18n/routing";

const handleLocalizedRequest = createMiddleware(routing);

/**
 * `CF-IPCountry` is only meaningful when every request provably passed through
 * Cloudflare and the Tunnel. The deployment sets this when that is the case;
 * anywhere else the country step of the negotiation is skipped.
 */
const trustCloudflareCountry = process.env.TRUST_CF_IPCOUNTRY === "true";

function isPublishedPath(path: string): boolean {
  return publicPages.some((page) => page.path === path);
}

/**
 * Metadata routes generated inside the `[locale]` segment. They have no file
 * extension, so the matcher cannot skip them without also passing unknown
 * prefixes such as `/fr/opengraph-image`; they are let through only under a
 * registered locale.
 */
const localeMetadataRoutes: readonly string[] = ["/opengraph-image"];

/**
 * Unknown document paths are answered here with a complete, localized 404
 * document. Rendering them through the app would only yield an empty shell
 * that is filled in by client-side JavaScript (Next.js 16.4 with Cache
 * Components), which fails the no-JavaScript and language requirements.
 */
async function notFoundResponse(locale: Locale): Promise<NextResponse> {
  return new NextResponse(await renderNotFoundDocument(locale), {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const { locale } = negotiateSiteLocale({
      preference: request.cookies.get(preferenceCookie.name)?.value,
      acceptLanguage: request.headers.get("accept-language"),
      country: request.headers.get("cf-ipcountry"),
      countryTrusted: trustCloudflareCountry,
    });
    const target = request.nextUrl.clone();
    target.pathname = `/${locale}`;
    const response = NextResponse.redirect(target, 307);
    // The target depends on the visitor, so no shared cache may store it.
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Vary", "Accept-Language, Cookie");
    return response;
  }

  const [, firstSegment = "", ...rest] = pathname.split("/");
  if (!isLocale(firstSegment)) {
    // `/about`, `/fr`: no locale is guessed and nothing is prefixed.
    return notFoundResponse(defaultLocale);
  }
  const localPath = `/${rest.join("/")}`;
  if (localeMetadataRoutes.includes(localPath)) {
    return NextResponse.next();
  }
  if (!isPublishedPath(localPath)) {
    // `/ja/missing`: a real 404 in the language of the prefix.
    return notFoundResponse(firstSegment);
  }
  return handleLocalizedRequest(request);
}

export const config = {
  // Skip Next.js internals (/_next/…), the exact /healthz and /apple-icon
  // routes, and any path with a file extension (sitemap.xml, robots.txt,
  // icon.svg, static files): those are served or rejected by their own
  // handlers. Exclusions are anchored so /healthz-status or /apple-icon/x still
  // get the 404 document. Matchers must be literals: a new extension-less root
  // metadata route is added here (tests/unit/proxy-matcher.test.ts).
  matcher: ["/((?!_next/|healthz$|apple-icon$|.*\\..*).*)"],
};
