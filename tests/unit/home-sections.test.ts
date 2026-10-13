import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  enabledHomeSections,
  findHomeSectionErrors,
  homeHero,
  homeNavSectionIds,
  homeSections,
  type HomeSection,
} from "@/config/home";
import { localeIds } from "@/config/locales";

function loadMessages(locale: string): unknown {
  const url = new URL(`../../messages/${locale}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as unknown;
}

const catalogs = Object.fromEntries(
  localeIds.map((locale) => [locale, loadMessages(locale)]),
);

const item = { title: "Title", body: "Body" };
const validCatalog = {
  header: { nav: { services: "Services", about: "About" } },
  home: {
    hero: {
      eyebrow: "E",
      title: "T",
      lead: "L",
      primaryCta: "P",
      secondaryCta: "S",
    },
    services: { heading: "H", intro: "I", items: { build: item } },
    about: { heading: "H", body: "B" },
  },
};
const validSections: HomeSection[] = [
  { type: "hero", id: "hero", enabled: true, design: "shadcnblocks" },
  {
    type: "cards",
    id: "services",
    enabled: true,
    design: "velora",
    nav: true,
    icons: { build: "code" },
  },
  { type: "text", id: "about", enabled: true, design: "velora", nav: true },
];

describe("home sections", () => {
  it("are valid as shipped in every language", () => {
    expect(findHomeSectionErrors(homeSections, catalogs)).toEqual([]);
  });

  it("derive the enabled order, the navigation and the hero from the list", () => {
    expect(enabledHomeSections.map((section) => section.id)).toEqual([
      "hero",
      "services",
      "approach",
      "about",
      "contact",
    ]);
    expect(homeNavSectionIds).toEqual([
      "services",
      "approach",
      "about",
      "contact",
    ]);
    expect(homeHero.id).toBe("hero");
  });

  it("accept a minimal valid composition", () => {
    expect(findHomeSectionErrors(validSections, { en: validCatalog })).toEqual(
      [],
    );
  });

  it("check copy only for enabled sections", () => {
    const withDisabled: HomeSection[] = [
      ...validSections,
      {
        type: "steps",
        id: "approach",
        enabled: false,
        design: "velora",
        nav: true,
      },
    ];
    expect(findHomeSectionErrors(withDisabled, { en: validCatalog })).toEqual(
      [],
    );
  });

  it("reject duplicate or malformed ids and a missing or misplaced hero", () => {
    const sections = [
      validSections[1],
      validSections[1],
      { ...validSections[0], id: "Hero" },
    ] as HomeSection[];
    expect(findHomeSectionErrors(sections, {})).toEqual([
      expect.stringContaining('"services" is listed twice'),
      expect.stringContaining('"Hero" must be lowercase kebab-case'),
      "exactly one hero must be enabled, as the first section",
    ]);
  });

  it("reject missing copy, items, icons and navigation labels per language", () => {
    const broken = {
      header: { nav: { services: "" } },
      home: {
        hero: { ...validCatalog.home.hero, lead: " " },
        services: { heading: "H", intro: "I", items: {} },
      },
    };
    expect(findHomeSectionErrors(validSections, { ja: broken })).toEqual([
      expect.stringContaining(
        'ja: section "hero" needs a non-empty home.hero.lead',
      ),
      expect.stringContaining('ja: section "services" needs at least one item'),
      expect.stringContaining('icon for unknown item "build"'),
      expect.stringContaining(
        'ja: section "services" is in the navigation but has no header.nav label',
      ),
      expect.stringContaining(
        'ja: section "about" has no copy under home.about',
      ),
    ]);
  });
});
