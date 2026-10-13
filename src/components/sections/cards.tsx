import { getTranslations } from "next-intl/server";

import {
  anchorOffset,
  container,
  itemIcon,
  navLabel,
  SectionHeading,
  sectionItems,
} from "@/components/sections/shared";
import type { HomeSection } from "@/config/home";

type CardsSection = Extract<HomeSection, { type: "cards" }>;

/** One card per item under `home.<id>.items`, in message order. */
export async function CardsSection({
  id,
  icons = {},
}: Pick<CardsSection, "id" | "icons">) {
  const [t, items, eyebrow] = await Promise.all([
    getTranslations(`home.${id}`),
    sectionItems(id),
    navLabel(id),
  ]);
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
          {items.map(({ key, title, body }) => {
            const ItemIcon = itemIcon(icons, key);
            return (
              <li
                key={key}
                className="rounded-2xl border border-border bg-card p-8 transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="w-fit rounded-xl bg-primary-soft p-3 text-primary">
                  <ItemIcon className="size-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
