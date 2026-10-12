import type { MetadataRoute } from "next";

import { locales } from "@/config/locales";
import { publicPages } from "@/config/public-pages";
import { site } from "@/config/site";

function absolute(path: string): string {
  return `${site.url}${path}`;
}

function localizedPath(localeId: string, path: string): string {
  return path === "/" ? `/${localeId}` : `/${localeId}${path}`;
}

/** One entry per language of each public page; every entry lists all languages, itself included. */
export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.flatMap((page) => {
    const languages: Record<string, string> = Object.fromEntries(
      locales.map((entry) => [
        entry.tag,
        absolute(localizedPath(entry.id, page.path)),
      ]),
    );
    if (page.path === "/") {
      // Same spelling as the HTML metadata: the origin without a trailing slash.
      languages["x-default"] = site.url;
    }
    return locales.map((entry) => ({
      url: absolute(localizedPath(entry.id, page.path)),
      alternates: { languages },
    }));
  });
}
