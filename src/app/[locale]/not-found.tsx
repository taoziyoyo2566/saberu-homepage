import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notFound");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <p className="text-sm font-medium text-primary tabular-nums">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-display text-balance sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-prose text-lg leading-relaxed text-muted-foreground">
        {t("description")}
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
      >
        {t("backHome")}
      </Link>
    </section>
  );
}
