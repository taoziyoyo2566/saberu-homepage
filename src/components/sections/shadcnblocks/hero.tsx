import { getTranslations } from "next-intl/server";

import { SparklesIcon } from "@/components/icons";
import { Hero115 } from "@/components/shadcnblocks/hero115";
import type { HomeSection } from "@/config/home";
import { site } from "@/config/site";

type HeroSection = Extract<HomeSection, { type: "hero" }>;

/** The hero drawn with shadcnblocks' Hero 115; the eyebrow becomes its byline. */
export async function Hero115Section({ id }: Pick<HeroSection, "id">) {
  const t = await getTranslations(`home.${id}`);
  return (
    <div id={id}>
      <Hero115
        icon={<SparklesIcon className="size-6" />}
        // The block's heading is plain text, so the emphasis markup is dropped.
        heading={t.markup("title", { em: (chunks) => chunks })}
        description={t("lead")}
        buttons={{
          primary: {
            text: t("primaryCta"),
            url: `mailto:${site.contactEmail}`,
          },
          secondary: site.productUrl
            ? { text: t("secondaryCta"), url: site.productUrl }
            : undefined,
        }}
        byline={t("eyebrow")}
      />
    </div>
  );
}
