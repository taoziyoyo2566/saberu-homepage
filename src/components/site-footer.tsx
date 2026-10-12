import { cacheLife } from "next/cache";
import { getTranslations } from "next-intl/server";

import { site } from "@/config/site";

// The year is the only time-dependent value on the site; caching it keeps the
// pages prerendered and lets the cache refresh it daily.
async function currentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function SiteFooter() {
  const [t, year] = await Promise.all([
    getTranslations("footer"),
    currentYear(),
  ]);
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:px-6">
        <span className="font-medium text-foreground">{site.name}</span>
        <span>{t("copyright", { year })}</span>
      </div>
    </footer>
  );
}
