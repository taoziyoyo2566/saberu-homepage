import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { GeistSans } from "geist/font/sans";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLocaleDefinition, localeIds } from "@/config/locales";
import { site } from "@/config/site";
import { routing } from "@/i18n/routing";

import "@/app/globals.css";

export function generateStaticParams() {
  return localeIds.map((locale) => ({ locale }));
}

/**
 * A first segment that is not a registered locale (`/fr`, `/about`) is a 404,
 * never a page rendered for a guessed language. `dynamicParams = false` is not
 * available with Cache Components, so the check is explicit.
 */
async function resolveLocale() {
  const candidate = await rootLocale();
  if (!hasLocale(routing.locales, candidate)) {
    notFound();
  }
  return candidate;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    metadataBase: new URL(site.url),
    title: t("title"),
    description: t("description"),
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const locale = await resolveLocale();
  const { tag } = getLocaleDefinition(locale);
  return (
    <html lang={tag} className={`${GeistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <NextIntlClientProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
