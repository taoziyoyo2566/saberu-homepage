import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import {
  HomeAbout,
  HomeApproach,
  HomeContact,
  HomeHero,
  HomeServices,
} from "@/components/home-sections";
import { getLocaleDefinition, isLocale, locales } from "@/config/locales";
import { site } from "@/config/site";

/**
 * Canonical, hreflang and Open Graph URLs live on the page, not the layout,
 * so error pages never inherit the home page's identity. The share image comes
 * from `./opengraph-image.tsx` in this segment.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([
    rootLocale(),
    getTranslations("metadata"),
  ]);
  const url = `/${locale}`;
  // The layout has already rejected unregistered values with notFound().
  const ogLocale = isLocale(locale)
    ? getLocaleDefinition(locale).ogLocale
    : undefined;
  return {
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(
          locales.map((entry) => [entry.tag, `/${entry.id}`]),
        ),
        "x-default": "/",
      },
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      url,
      title: t("title"),
      description: t("description"),
      locale: ogLocale,
      alternateLocale: locales
        .filter((entry) => entry.id !== locale)
        .map((entry) => entry.ogLocale),
    },
  };
}

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeServices />
      <HomeApproach />
      <HomeAbout />
      <HomeContact />
    </>
  );
}
