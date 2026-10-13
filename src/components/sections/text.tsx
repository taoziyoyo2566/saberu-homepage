import { getTranslations } from "next-intl/server";

import {
  anchorOffset,
  container,
  navLabel,
  SectionHeading,
} from "@/components/sections/shared";
import type { HomeSection } from "@/config/home";

type TextSection = Extract<HomeSection, { type: "text" }>;

/** Heading beside a paragraph. */
export async function TextSection({ id }: Pick<TextSection, "id">) {
  const [t, eyebrow] = await Promise.all([
    getTranslations(`home.${id}`),
    navLabel(id),
  ]);
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`${anchorOffset} py-20 sm:py-28`}
    >
      <div
        className={`${container} grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-16`}
      >
        <SectionHeading
          id={id}
          eyebrow={eyebrow}
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
