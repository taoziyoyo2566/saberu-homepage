import { getTranslations } from "next-intl/server";

import {
  BlockSection,
  itemIcon,
  sectionItems,
} from "@/components/sections/shared";
import { Feature43 } from "@/components/shadcnblocks/feature43";
import type { HomeSection } from "@/config/home";

type CardsSection = Extract<HomeSection, { type: "cards" }>;

/** A cards section drawn with shadcnblocks' Feature 43. */
export async function Feature43Section({
  id,
  icons = {},
}: Pick<CardsSection, "id" | "icons">) {
  const [t, items] = await Promise.all([
    getTranslations(`home.${id}`),
    sectionItems(id),
  ]);
  const heading = t("heading");
  return (
    <BlockSection id={id} label={heading}>
      <Feature43
        heading={heading}
        description={t("intro")}
        features={items.map(({ key, title, body }) => {
          const ItemIcon = itemIcon(icons, key);
          return {
            title,
            description: body,
            icon: <ItemIcon className="size-5" />,
          };
        })}
      />
    </BlockSection>
  );
}
