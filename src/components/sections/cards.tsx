import { getMessages, getTranslations } from "next-intl/server";

import { iconsByName, SparklesIcon } from "@/components/icons";
import {
  anchorOffset,
  container,
  navLabel,
  SectionHeading,
} from "@/components/sections/shared";
import type { HomeSection } from "@/config/home";

type CardsSection = Extract<HomeSection, { type: "cards" }>;

/**
 * One card per item under `home.<id>.items`, in message order; an item added
 * there (in every language) gets a card without touching this component.
 */
export async function CardsSection({
  id,
  icons = {},
}: Pick<CardsSection, "id" | "icons">) {
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
      className={`${anchorOffset} py-20 sm:py-28`}
    >
      <div className={container}>
        <SectionHeading
          id={id}
          eyebrow={eyebrow}
          heading={t("heading")}
          intro={t("intro")}
          centered
        />
        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {keys.map((key) => {
            const name = icons[key];
            const ItemIcon = name ? iconsByName[name] : SparklesIcon;
            return (
              <li
                key={key}
                className="rounded-2xl border border-line bg-surface p-8 transition-[border-color,box-shadow] duration-300 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
              >
                <div className="w-fit rounded-xl bg-accent-soft p-3 text-accent">
                  <ItemIcon className="size-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">
                  {item(key, "title")}
                </h3>
                <p className="mt-2 leading-relaxed text-muted">
                  {item(key, "body")}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
