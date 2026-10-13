import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { homeNavSectionIds } from "@/config/home";

export const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";
// The sticky header is two rows tall on narrow screens, one row from `md`.
export const anchorOffset = "scroll-mt-28 md:scroll-mt-20";
const headingClass =
  "text-3xl font-semibold tracking-display text-balance sm:text-4xl";
const introClass = "mt-4 text-lg leading-relaxed text-pretty text-muted";

/** A section's navigation label, which its heading repeats as an eyebrow. */
export async function navLabel(id: string): Promise<string | undefined> {
  const navId = homeNavSectionIds.find((candidate) => candidate === id);
  if (navId === undefined) {
    return undefined;
  }
  const t = await getTranslations("header.nav");
  return t(navId);
}

/** Eyebrow, heading and intro shared by the content sections. */
export function SectionHeading({
  id,
  eyebrow,
  heading,
  intro,
  centered,
}: {
  readonly id: string;
  readonly eyebrow: string | undefined;
  readonly heading: string;
  readonly intro?: ReactNode;
  readonly centered: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      {eyebrow ? (
        <p className="mb-3 text-sm font-medium text-accent">{eyebrow}</p>
      ) : null}
      <h2 id={`${id}-heading`} className={headingClass}>
        {heading}
      </h2>
      {intro ? <p className={introClass}>{intro}</p> : null}
    </div>
  );
}
