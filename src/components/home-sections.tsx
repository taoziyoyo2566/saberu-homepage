import { getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import {
  ArrowRightIcon,
  CodeIcon,
  MailIcon,
  ServerIcon,
  ShieldCheckIcon,
  SparklesIcon,
  type IconComponent,
} from "@/components/icons";
import { AnimatedGradientText } from "@/components/velora/animated-gradient-text";
import { AuroraBackground } from "@/components/velora/aurora-background";
import { DotPattern, GridPattern } from "@/components/velora/grid-pattern";
import { ShimmerLink } from "@/components/velora/shimmer-link";
import { site } from "@/config/site";

/** Section anchors in page order; the header navigation renders the same list. */
export const homeSectionIds = [
  "services",
  "approach",
  "about",
  "contact",
] as const;

type HomeSectionId = (typeof homeSectionIds)[number];

const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";
// The sticky header is two rows tall on narrow screens, one row from `md`.
const anchorOffset = "scroll-mt-28 md:scroll-mt-20";
const headingClass =
  "text-3xl font-semibold tracking-display text-balance sm:text-4xl";
const introClass = "mt-4 text-lg leading-relaxed text-pretty text-muted";

/** Eyebrow, heading and intro shared by the sections; the eyebrow repeats the navigation label. */
async function SectionHeading({
  section,
  heading,
  intro,
  centered,
}: {
  readonly section: HomeSectionId;
  readonly heading: string;
  readonly intro?: ReactNode;
  readonly centered: boolean;
}) {
  const t = await getTranslations("header.nav");
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <p className="text-sm font-medium text-accent">{t(section)}</p>
      <h2 id={`${section}-heading`} className={`mt-3 ${headingClass}`}>
        {heading}
      </h2>
      {intro ? <p className={introClass}>{intro}</p> : null}
    </div>
  );
}

export async function HomeHero() {
  const t = await getTranslations("home.hero");
  return (
    <section className="relative isolate overflow-hidden">
      <AuroraBackground className="[mask-image:linear-gradient(to_bottom,black_55%,transparent)]" />
      <GridPattern className="[mask-image:radial-gradient(ellipse_60%_55%_at_50%_0%,black,transparent)]" />
      <div
        className={`${container} relative pt-20 pb-24 text-center sm:pt-28 sm:pb-32`}
      >
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-1.5 text-sm font-medium backdrop-blur motion-safe:animate-fade-up">
          <SparklesIcon className="size-3.5 text-accent" />
          {t("eyebrow")}
        </p>
        {/* Not animated in: the heading and lead are the largest paint and
            must be readable at once, with or without JavaScript. */}
        <h1 className="mx-auto mt-8 max-w-4xl text-4xl leading-[1.15] font-semibold tracking-display text-balance sm:text-6xl lg:text-7xl">
          {t.rich("title", {
            em: (chunks) => (
              <AnimatedGradientText>{chunks}</AnimatedGradientText>
            ),
          })}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-muted">
          {t("lead")}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 motion-safe:animate-fade-up motion-safe:[animation-delay:150ms]">
          <ShimmerLink href={`mailto:${site.contactEmail}`}>
            <MailIcon className="size-4" />
            {t("primaryCta")}
          </ShimmerLink>
          {site.productUrl ? (
            <a
              href={site.productUrl}
              className="group inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-medium hover:bg-group"
            >
              {t("secondaryCta")}
              <ArrowRightIcon className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5" />
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// Icons follow the item keys in `messages/<locale>.json`; an item added there
// (in every language) gets a card with the fallback icon, without touching
// the rest of this component.
const serviceIcons: Partial<Record<string, IconComponent>> = {
  build: CodeIcon,
  run: ShieldCheckIcon,
  host: ServerIcon,
};

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
      className={`${anchorOffset} py-20 sm:py-28`}
    >
      <div className={container}>
        <SectionHeading
          section="services"
          heading={t("heading")}
          intro={t("intro")}
          centered
        />
        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {keys.map((key) => {
            const ItemIcon = serviceIcons[key] ?? SparklesIcon;
            return (
              <li
                key={key}
                className="rounded-2xl border border-line bg-surface p-8 transition-[border-color,box-shadow] duration-300 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
              >
                <div className="w-fit rounded-xl bg-accent-soft p-3 text-accent">
                  <ItemIcon className="size-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="mt-2 leading-relaxed text-muted">
                  {t(`items.${key}.body`)}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
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
      className={`${anchorOffset} relative isolate overflow-hidden border-y border-line bg-group/40 py-20 sm:py-28`}
    >
      <DotPattern className="[mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,black,transparent)]" />
      <div className={`${container} relative`}>
        <SectionHeading
          section="approach"
          heading={t("heading")}
          intro={t("intro")}
          centered
        />
        {/* Numbered because the principles follow a project's course: agree
            the scope, verify each release, hand over what is the client's. */}
        <div className="relative mt-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-6 right-[16.7%] left-[16.7%] hidden h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent md:block"
          />
          <ol className="relative grid gap-12 md:grid-cols-3 md:gap-8">
            {keys.map((key, index) => (
              <li key={key} className="text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-line bg-surface text-sm font-semibold text-accent tabular-nums shadow-sm">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-6 text-lg font-semibold">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="mx-auto mt-2 max-w-sm leading-relaxed text-muted">
                  {t(`items.${key}.body`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export async function HomeAbout() {
  const t = await getTranslations("home.about");
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className={`${anchorOffset} py-20 sm:py-28`}
    >
      <div
        className={`${container} grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-16`}
      >
        <SectionHeading
          section="about"
          heading={t("heading")}
          centered={false}
        />
        <p className="text-lg leading-relaxed text-pretty text-muted md:pt-9 md:text-xl">
          {t("body")}
        </p>
      </div>
    </section>
  );
}

export async function HomeContact() {
  const t = await getTranslations("home.contact");
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className={`${anchorOffset} pb-24 sm:pb-32`}
    >
      <div className={container}>
        <div className="relative isolate overflow-hidden rounded-3xl border border-line bg-surface px-6 py-16 text-center sm:px-16 sm:py-24">
          <AuroraBackground />
          <GridPattern className="[mask-image:radial-gradient(ellipse_60%_60%_at_50%_100%,black,transparent)]" />
          <div className="relative">
            <h2
              id="contact-heading"
              className="text-3xl font-semibold tracking-display text-balance sm:text-5xl"
            >
              {t("heading")}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted">
              {t("body")}
            </p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <ShimmerLink href={`mailto:${site.contactEmail}`} size="large">
                <MailIcon className="size-5" />
                {t("email")}
              </ShimmerLink>
              <a
                href={`mailto:${site.contactEmail}`}
                className="text-sm font-medium break-all text-muted underline-offset-4 hover:text-accent hover:underline"
              >
                {site.contactEmail}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
