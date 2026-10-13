import { getTranslations } from "next-intl/server";

import {
  anchorOffset,
  container,
  navLabel,
  SectionHeading,
  sectionItems,
} from "@/components/sections/shared";
import { DotPattern } from "@/components/velora/grid-pattern";
import type { HomeSection } from "@/config/home";

type StepsSection = Extract<HomeSection, { type: "steps" }>;

/** Numbered items, for content whose order matters (a project's course). */
export async function StepsSection({ id }: Pick<StepsSection, "id">) {
  const [t, items, eyebrow] = await Promise.all([
    getTranslations(`home.${id}`),
    sectionItems(id),
    navLabel(id),
  ]);
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`${anchorOffset} relative isolate overflow-hidden border-y border-border bg-muted/40 py-20 sm:py-28`}
    >
      <DotPattern className="[mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,black,transparent)]" />
      <div className={`${container} relative`}>
        <SectionHeading
          id={id}
          eyebrow={eyebrow}
          heading={t("heading")}
          intro={t("intro")}
          centered
        />
        <div className="relative mt-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-6 right-[16.7%] left-[16.7%] hidden h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent md:block"
          />
          <ol className="relative grid gap-12 md:grid-cols-3 md:gap-8">
            {items.map(({ key, title, body }, index) => (
              <li key={key} className="text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold text-primary tabular-nums shadow-sm">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mx-auto mt-2 max-w-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
