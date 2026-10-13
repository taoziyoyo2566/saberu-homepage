import { getTranslations } from "next-intl/server";

import { BlockSection } from "@/components/sections/shared";
import { Cta10 } from "@/components/shadcnblocks/cta10";
import type { HomeSection } from "@/config/home";
import { site } from "@/config/site";

type ContactSection = Extract<HomeSection, { type: "contact" }>;

/**
 * A contact section drawn with shadcnblocks' Cta 10: the email action, and
 * the address itself as the second button so it stays readable.
 */
export async function Cta10Section({ id }: Pick<ContactSection, "id">) {
  const t = await getTranslations(`home.${id}`);
  const mailto = `mailto:${site.contactEmail}`;
  const heading = t("heading");
  return (
    <BlockSection id={id} label={heading}>
      <Cta10
        heading={heading}
        description={t("body")}
        buttons={{
          primary: { text: t("email"), url: mailto },
          secondary: { text: site.contactEmail, url: mailto },
        }}
      />
    </BlockSection>
  );
}
