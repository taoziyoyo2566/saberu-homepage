import { getTranslations } from "next-intl/server";

import { BrandMark } from "@/components/brand-mark";
import { homeSectionIds } from "@/components/home-sections";
import { LanguageSwitcher } from "@/components/language-switcher";
import { site } from "@/config/site";
import { Link } from "@/i18n/navigation";

export async function SiteHeader() {
  const t = await getTranslations("header");
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
        <Link
          href="/"
          aria-label={t("home")}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <BrandMark
            size={24}
            rounded
            background="var(--accent)"
            foreground="var(--bg)"
          />
          {site.name}
        </Link>
        <nav aria-label={t("navigation")}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {homeSectionIds.map((section) => (
              <li key={section}>
                {/* Absolute so the links also work from any later page. */}
                <Link href={`/#${section}`} className="hover:text-accent">
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
