import type { IconName } from "@/components/icons";

import en from "../../messages/en.json";

/**
 * Composition of the home page: which sections it shows, in which order, and
 * which of them the header and footer link to. Each entry is one instance of a
 * layout type. Its copy lives under `home.<id>` and, when it is in the
 * navigation, its label under `header.nav.<id>` in every
 * `messages/<locale>.json`; the id is also the section's anchor (`/#<id>`).
 * Turning a section off keeps its copy, so it can come back unchanged.
 */

type HomeCopy = (typeof en)["home"];

/** Ids under `home` whose English copy has the fields a layout reads. */
type IdsShaped<Shape> = {
  [Id in keyof HomeCopy]: HomeCopy[Id] extends Shape ? Id : never;
}[keyof HomeCopy];

interface ItemCopy {
  readonly title: string;
  readonly body: string;
}

interface HeroCopy {
  readonly eyebrow: string;
  readonly title: string;
  readonly lead: string;
  readonly primaryCta: string;
  readonly secondaryCta: string;
}

interface ListCopy {
  readonly heading: string;
  readonly intro: string;
  readonly items: Readonly<Record<string, ItemCopy>>;
}

interface TextCopy {
  readonly heading: string;
  readonly body: string;
}

interface ContactCopy {
  readonly heading: string;
  readonly body: string;
  readonly email: string;
}

interface Listed {
  readonly enabled: boolean;
  /** Linked from the header and footer; needs `header.nav.<id>`. */
  readonly nav: boolean;
}

export type HomeSection =
  /** Page opener with the only `h1`; must be the first enabled section. */
  | {
      readonly type: "hero";
      readonly id: IdsShaped<HeroCopy>;
      readonly enabled: boolean;
    }
  /** Cards side by side; `icons` maps item keys to icons (default: sparkles). */
  | (Listed & {
      readonly type: "cards";
      readonly id: IdsShaped<ListCopy>;
      readonly icons?: Readonly<Record<string, IconName>>;
    })
  /** Numbered steps, for content whose order matters. */
  | (Listed & { readonly type: "steps"; readonly id: IdsShaped<ListCopy> })
  /** Heading beside a paragraph. */
  | (Listed & { readonly type: "text"; readonly id: IdsShaped<TextCopy> })
  /** Closing panel with the contact email. */
  | (Listed & {
      readonly type: "contact";
      readonly id: IdsShaped<ContactCopy>;
    });

export type HomeSectionType = HomeSection["type"];

export const homeSections: readonly HomeSection[] = [
  { type: "hero", id: "hero", enabled: true },
  {
    type: "cards",
    id: "services",
    enabled: true,
    nav: true,
    icons: { build: "code", run: "shield-check", host: "server" },
  },
  { type: "steps", id: "approach", enabled: true, nav: true },
  { type: "text", id: "about", enabled: true, nav: true },
  { type: "contact", id: "contact", enabled: true, nav: true },
];

const requiredFields: Readonly<Record<HomeSectionType, readonly string[]>> = {
  hero: ["eyebrow", "title", "lead", "primaryCta", "secondaryCta"],
  cards: ["heading", "intro"],
  steps: ["heading", "intro"],
  text: ["heading", "body"],
  contact: ["heading", "body", "email"],
};

const ID_PATTERN = /^[a-z][a-z0-9-]*$/;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "";
}

function findCopyErrors(
  section: HomeSection,
  catalog: unknown,
  locale: string,
): string[] {
  const errors: string[] = [];
  const where = `${locale}: section "${section.id}"`;
  const home = isRecord(catalog) ? catalog.home : undefined;
  const copy = isRecord(home) ? home[section.id] : undefined;
  if (!isRecord(copy)) {
    return [`${where} has no copy under home.${section.id}`];
  }
  for (const field of requiredFields[section.type]) {
    if (!isText(copy[field])) {
      errors.push(`${where} needs a non-empty home.${section.id}.${field}`);
    }
  }
  if (section.type === "cards" || section.type === "steps") {
    const items = copy.items;
    const keys = isRecord(items) ? Object.keys(items) : [];
    if (keys.length === 0) {
      errors.push(`${where} needs at least one item`);
    }
    for (const key of keys) {
      const item = isRecord(items) ? items[key] : undefined;
      if (!isRecord(item) || !isText(item.title) || !isText(item.body)) {
        errors.push(`${where} item "${key}" needs a title and a body`);
      }
    }
    if (section.type === "cards") {
      for (const key of Object.keys(section.icons ?? {})) {
        if (!keys.includes(key)) {
          errors.push(`${where} has an icon for unknown item "${key}"`);
        }
      }
    }
  }
  if (section.type !== "hero" && section.nav) {
    const header = isRecord(catalog) ? catalog.header : undefined;
    const nav = isRecord(header) ? header.nav : undefined;
    if (!isRecord(nav) || !isText(nav[section.id])) {
      errors.push(`${where} is in the navigation but has no header.nav label`);
    }
  }
  return errors;
}

/**
 * Lists every defect in a section list checked against message catalogs
 * keyed by locale; an empty list means valid.
 */
export function findHomeSectionErrors(
  sections: readonly HomeSection[],
  catalogs: Readonly<Record<string, unknown>>,
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const section of sections) {
    if (!ID_PATTERN.test(section.id)) {
      errors.push(`section id "${section.id}" must be lowercase kebab-case`);
    }
    if (seen.has(section.id)) {
      errors.push(`section id "${section.id}" is listed twice`);
    }
    seen.add(section.id);
  }
  const enabled = sections.filter((section) => section.enabled);
  const heroes = enabled.filter((section) => section.type === "hero");
  if (heroes.length !== 1 || enabled[0]?.type !== "hero") {
    errors.push("exactly one hero must be enabled, as the first section");
  }
  for (const [locale, catalog] of Object.entries(catalogs)) {
    for (const section of enabled) {
      errors.push(...findCopyErrors(section, catalog, locale));
    }
  }
  return errors;
}

export function assertHomeSections(
  sections: readonly HomeSection[],
  catalogs: Readonly<Record<string, unknown>>,
): void {
  const errors = findHomeSectionErrors(sections, catalogs);
  if (errors.length > 0) {
    throw new Error(`Invalid home sections:\n- ${errors.join("\n- ")}`);
  }
}

// The types already tie each id to English copy of the right shape; failing
// at import time also stops `next build` on a broken composition. Every
// language is checked by tests/unit/home-sections.test.ts.
assertHomeSections(homeSections, { en });

export const enabledHomeSections = homeSections.filter(
  (section) => section.enabled,
);

export type HomeNavId = keyof (typeof en)["header"]["nav"];

function isNavId(id: string): id is HomeNavId {
  return Object.hasOwn(en.header.nav, id);
}

/** Anchors the header and footer link to, in page order. */
export const homeNavSectionIds: readonly HomeNavId[] = enabledHomeSections
  .filter((section) => section.type !== "hero" && section.nav)
  .map((section) => section.id)
  .filter(isNavId);

function findHero(): Extract<HomeSection, { type: "hero" }> {
  const [first] = enabledHomeSections;
  // assertHomeSections above has already required this.
  if (first?.type !== "hero") {
    throw new Error("The first enabled home section must be the hero");
  }
  return first;
}

/** The enabled hero; the footer repeats its eyebrow as the site tagline. */
export const homeHero = findHero();
