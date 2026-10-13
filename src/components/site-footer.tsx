import { cacheLife } from "next/cache";
import { getTranslations } from "next-intl/server";

import { BrandMark } from "@/components/brand-mark";
import { homeSectionIds } from "@/components/home-sections";
import { site } from "@/config/site";
import { Link } from "@/i18n/navigation";

// The year is the only time-dependent value on the site; caching it keeps the
// pages prerendered and lets the cache refresh it daily.
async function currentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function SiteFooter() {
  const [t, header, hero, year] = await Promise.all([
    getTranslations("footer"),
    getTranslations("header"),
    getTranslations("home.hero"),
    currentYear(),
  ]);
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div>
          <p className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <BrandMark
              size={24}
              rounded
              background="var(--accent)"
              foreground="var(--accent-fg)"
            />
            {site.name}
          </p>
          <p className="mt-3 text-sm text-muted">{hero("eyebrow")}</p>
        </div>
        {/* Plain list, not a second navigation landmark: the header owns that. */}
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {homeSectionIds.map((section) => (
            <li key={section}>
              <Link
                href={`/#${section}`}
                className="text-muted transition-colors hover:text-foreground"
              >
                {header(`nav.${section}`)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-line/70">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
          <span>{t("copyright", { year })}</span>
          <a
            href={`mailto:${site.contactEmail}`}
            className="break-all transition-colors hover:text-accent"
          >
            {site.contactEmail}
          </a>
        </div>
      </div>
    </footer>
  );
}
