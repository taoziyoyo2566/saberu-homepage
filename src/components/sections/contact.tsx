import { getTranslations } from "next-intl/server";

import { MailIcon } from "@/components/icons";
import { anchorOffset, container } from "@/components/sections/shared";
import { AuroraBackground } from "@/components/velora/aurora-background";
import { GridPattern } from "@/components/velora/grid-pattern";
import { ShimmerLink } from "@/components/velora/shimmer-link";
import type { HomeSection } from "@/config/home";
import { site } from "@/config/site";

type ContactSection = Extract<HomeSection, { type: "contact" }>;

/** Closing panel with the contact email as a button and as plain text. */
export async function ContactSection({ id }: Pick<ContactSection, "id">) {
  const t = await getTranslations(`home.${id}`);
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`${anchorOffset} pb-24 sm:pb-32`}
    >
      <div className={container}>
        <div className="relative isolate overflow-hidden rounded-3xl border border-line bg-surface px-6 py-16 text-center sm:px-16 sm:py-24">
          <AuroraBackground />
          <GridPattern className="[mask-image:radial-gradient(ellipse_60%_60%_at_50%_100%,black,transparent)]" />
          <div className="relative">
            <h2
              id={`${id}-heading`}
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
