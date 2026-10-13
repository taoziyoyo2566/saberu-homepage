import { getTranslations } from "next-intl/server";

import { BlockSection } from "@/components/sections/shared";
import { About29 } from "@/components/shadcnblocks/about29";
import type { HomeSection } from "@/config/home";

type TextSection = Extract<HomeSection, { type: "text" }>;

/** A text section drawn with shadcnblocks' About 29. */
export async function About29Section({ id }: Pick<TextSection, "id">) {
  const t = await getTranslations(`home.${id}`);
  const heading = t("heading");
  return (
    <BlockSection id={id} label={heading}>
      <About29 heading={heading} description={t("body")} />
    </BlockSection>
  );
}
