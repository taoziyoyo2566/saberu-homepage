import { getMessages, getTranslations } from "next-intl/server";

import {
  anchorOffset,
  container,
  navLabel,
  SectionHeading,
} from "@/components/sections/shared";
import { DotPattern } from "@/components/velora/grid-pattern";
import type { HomeSection } from "@/config/home";

type StepsSection = Extract<HomeSection, { type: "steps" }>;

/** Numbered items, for content whose order matters (a project's course). */
export async function StepsSection({ id }: Pick<StepsSection, "id">) {
  const [t, messages, eyebrow] = await Promise.all([
    getTranslations(`home.${id}`),
    getMessages(),
    navLabel(id),
  ]);
  const keys = Object.keys(messages.home[id].items);
  // The keys come from this section's own messages, so every one resolves.
  const item = (key: string, field: "title" | "body") =>
    t(`items.${key}.${field}` as Parameters<typeof t>[0]);
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`${anchorOffset} relative isolate overflow-hidden border-y border-line bg-group/40 py-20 sm:py-28`}
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
            className="pointer-events-none absolute top-6 right-[16.7%] left-[16.7%] hidden h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent md:block"
          />
          <ol className="relative grid gap-12 md:grid-cols-3 md:gap-8">
            {keys.map((key, index) => (
              <li key={key} className="text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-line bg-surface text-sm font-semibold text-accent tabular-nums shadow-sm">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-6 text-lg font-semibold">
                  {item(key, "title")}
                </h3>
                <p className="mx-auto mt-2 max-w-sm leading-relaxed text-muted">
                  {item(key, "body")}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
