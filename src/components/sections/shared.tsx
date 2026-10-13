import { getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import {
  iconsByName,
  SparklesIcon,
  type IconComponent,
  type IconName,
} from "@/components/icons";
import { homeNavSectionIds, type HomeSection } from "@/config/home";

type ListSectionId = Extract<HomeSection, { type: "cards" | "steps" }>["id"];

export interface SectionItem {
  readonly key: string;
  readonly title: string;
  readonly body: string;
}

/**
 * The items under `home.<id>.items`, in message order; an item added there
 * (in every language) appears without touching the section components.
 */
export async function sectionItems(id: ListSectionId): Promise<SectionItem[]> {
  const [t, messages] = await Promise.all([
    getTranslations(`home.${id}`),
    getMessages(),
  ]);
  // The keys come from this section's own messages, so every one resolves.
  const field = (key: string, name: "title" | "body") =>
    t(`items.${key}.${name}` as Parameters<typeof t>[0]);
  return Object.keys(messages.home[id].items).map((key) => ({
    key,
    title: field(key, "title"),
    body: field(key, "body"),
  }));
}

/** The icon a cards section configures for an item; sparkles by default. */
export function itemIcon(
  icons: Readonly<Record<string, IconName>>,
  key: string,
): IconComponent {
  const name = icons[key];
  return name ? iconsByName[name] : SparklesIcon;
}

export const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";
// The sticky header is two rows tall on narrow screens, one row from `md`.
export const anchorOffset = "scroll-mt-28 md:scroll-mt-20";
const headingClass =
  "text-3xl font-semibold tracking-display text-balance sm:text-4xl";
const introClass =
  "mt-4 text-lg leading-relaxed text-pretty text-muted-foreground";

/**
 * Mounts a registry block as a page section: the anchor for `/#<id>` and a
 * region named by the block's heading, which the block's own unnamed
 * `<section>` does not provide.
 */
export function BlockSection({
  id,
  label,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <section id={id} aria-label={label} className={anchorOffset}>
      {children}
    </section>
  );
}

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
        <p className="mb-3 text-sm font-medium text-primary">{eyebrow}</p>
      ) : null}
      <h2 id={`${id}-heading`} className={headingClass}>
        {heading}
      </h2>
      {intro ? <p className={introClass}>{intro}</p> : null}
    </div>
  );
}
