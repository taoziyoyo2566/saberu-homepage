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
    <section className="mx-auto w-full max-w-5xl px-4 py-24 sm:px-6">
      <p className="text-sm tracking-wide text-muted">404</p>
      <h1 className="mt-3 text-3xl font-semibold text-balance">{t("title")}</h1>
      <p className="mt-4 max-w-prose text-muted">{t("description")}</p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-md border border-line px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
      >
        {t("backHome")}
      </Link>
    </section>
  );
}
