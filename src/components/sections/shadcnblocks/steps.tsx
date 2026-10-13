import { getTranslations } from "next-intl/server";

import { BlockSection, sectionItems } from "@/components/sections/shared";
import { Process1 } from "@/components/shadcnblocks/process1";
import type { HomeSection } from "@/config/home";

type StepsSection = Extract<HomeSection, { type: "steps" }>;

/** A steps section drawn with shadcnblocks' Process 1. */
export async function Process1Section({ id }: Pick<StepsSection, "id">) {
  const [t, items] = await Promise.all([
    getTranslations(`home.${id}`),
    sectionItems(id),
  ]);
  const heading = t("heading");
  return (
    <BlockSection id={id} label={heading}>
      <Process1
        heading={heading}
        description={t("intro")}
        steps={items.map(({ title, body }) => ({ title, description: body }))}
      />
    </BlockSection>
  );
}
