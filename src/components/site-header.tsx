import { getTranslations } from "next-intl/server";

import { BrandMark } from "@/components/brand-mark";
import { homeSectionIds } from "@/components/home-sections";
import { LanguageSwitcher } from "@/components/language-switcher";
import { site } from "@/config/site";
import { Link } from "@/i18n/navigation";

export async function SiteHeader() {
  const t = await getTranslations("header");
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-background/75 backdrop-blur-md">
      {/* One row from `md`; below it the section links wrap to a second,
          scrollable row so brand and languages stay on the first. */}
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 px-4 sm:px-6">
        <Link
          href="/"
          aria-label={t("home")}
          className="flex h-16 items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <BrandMark
            size={26}
            rounded
            background="var(--accent)"
            foreground="var(--accent-fg)"
          />
          {site.name}
        </Link>
        <nav
          aria-label={t("navigation")}
          className="order-last -mx-4 w-[calc(100%+2rem)] overflow-x-auto border-t border-line/70 sm:-mx-6 sm:w-[calc(100%+3rem)] md:order-none md:mx-0 md:w-auto md:border-0"
        >
          <ul className="flex gap-x-6 px-4 py-2.5 text-sm whitespace-nowrap sm:px-6 md:px-0 md:py-0">
            {homeSectionIds.map((section) => (
              <li key={section}>
                {/* Absolute so the links also work from any later page. */}
                <Link
                  href={`/#${section}`}
                  className="text-muted transition-colors hover:text-foreground"
                >
                  {t(`nav.${section}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
