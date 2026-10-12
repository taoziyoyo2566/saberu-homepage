import { getMessages, getTranslations } from "next-intl/server";

import { site } from "@/config/site";

/** Section anchors in page order; the header navigation renders the same list. */
export const homeSectionIds = [
  "services",
  "approach",
  "about",
  "contact",
] as const;

const container = "mx-auto w-full max-w-5xl px-4 sm:px-6";
const sectionClass = `${container} scroll-mt-20 py-14 sm:py-16`;
const headingClass = "text-2xl font-semibold text-balance sm:text-3xl";
const introClass = "mt-4 max-w-2xl leading-relaxed text-muted";
const primaryButton =
  "inline-flex items-center rounded-md bg-accent px-5 py-3 font-medium text-background hover:opacity-90";
const secondaryButton =
  "inline-flex items-center rounded-md border border-line px-5 py-3 font-medium hover:border-accent hover:text-accent";

export async function HomeHero() {
  const t = await getTranslations("home.hero");
  return (
    <section className={`${container} py-16 sm:py-24`}>
      <p className="text-sm font-medium tracking-wide text-accent">
        {t("eyebrow")}
      </p>
      <h1 className="mt-4 max-w-4xl text-4xl leading-tight font-semibold text-balance sm:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
        {t("lead")}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a href={`mailto:${site.contactEmail}`} className={primaryButton}>
          {t("primaryCta")}
        </a>
        {site.productUrl ? (
          <a href={site.productUrl} className={secondaryButton}>
            {t("secondaryCta")}
          </a>
        ) : null}
      </div>
    </section>
  );
}

// Cards come from `messages/<locale>.json`: adding an item there (in every
// language) adds a card, without touching this component.
export async function HomeServices() {
  const [t, messages] = await Promise.all([
    getTranslations("home.services"),
    getMessages(),
  ]);
  const keys = Object.keys(messages.home.services.items) as Array<
    keyof typeof messages.home.services.items
  >;
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className={sectionClass}
    >
      <h2 id="services-heading" className={headingClass}>
        {t("heading")}
      </h2>
      <p className={introClass}>{t("intro")}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {keys.map((key) => (
          <li
            key={key}
            className="rounded-xl border border-line bg-surface p-6"
          >
            <h3 className="text-lg font-semibold">{t(`items.${key}.title`)}</h3>
            <p className="mt-2 leading-relaxed text-muted">
              {t(`items.${key}.body`)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function HomeApproach() {
  const [t, messages] = await Promise.all([
    getTranslations("home.approach"),
    getMessages(),
  ]);
  const keys = Object.keys(messages.home.approach.items) as Array<
    keyof typeof messages.home.approach.items
  >;
  return (
    <section
      id="approach"
      aria-labelledby="approach-heading"
      className={sectionClass}
    >
      <h2 id="approach-heading" className={headingClass}>
        {t("heading")}
      </h2>
      <p className={introClass}>{t("intro")}</p>
      <ol className="mt-8 grid gap-6 sm:grid-cols-3">
        {keys.map((key, index) => (
          <li key={key} className="border-t border-line pt-5">
            <span className="text-sm font-medium text-accent tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-2 text-lg font-semibold">
              {t(`items.${key}.title`)}
            </h3>
            <p className="mt-2 leading-relaxed text-muted">
              {t(`items.${key}.body`)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export async function HomeAbout() {
  const t = await getTranslations("home.about");
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className={sectionClass}
    >
      <h2 id="about-heading" className={headingClass}>
        {t("heading")}
      </h2>
      <p className={`${introClass} max-w-prose`}>{t("body")}</p>
    </section>
  );
}

export async function HomeContact() {
  const t = await getTranslations("home.contact");
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className={`${sectionClass} pb-20`}
    >
      <div className="rounded-2xl border border-line bg-surface p-8 sm:p-10">
        <h2 id="contact-heading" className={headingClass}>
          {t("heading")}
        </h2>
        <p className={`${introClass} max-w-prose`}>{t("body")}</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          <a href={`mailto:${site.contactEmail}`} className={primaryButton}>
            {t("email")}
          </a>
          <a
            href={`mailto:${site.contactEmail}`}
            className="font-medium break-all underline-offset-4 hover:text-accent hover:underline"
          >
            {site.contactEmail}
          </a>
        </div>
      </div>
    </section>
  );
}
