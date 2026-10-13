import { getTranslations } from "next-intl/server";

import { ArrowRightIcon, MailIcon, SparklesIcon } from "@/components/icons";
import { container } from "@/components/sections/shared";
import { AnimatedGradientText } from "@/components/velora/animated-gradient-text";
import { AuroraBackground } from "@/components/velora/aurora-background";
import { GridPattern } from "@/components/velora/grid-pattern";
import { ShimmerLink } from "@/components/velora/shimmer-link";
import type { HomeSection } from "@/config/home";
import { site } from "@/config/site";

type HeroSection = Extract<HomeSection, { type: "hero" }>;

export async function HeroSection({ id }: { readonly id: HeroSection["id"] }) {
  const t = await getTranslations(`home.${id}`);
  return (
    <section id={id} className="relative isolate overflow-hidden">
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
