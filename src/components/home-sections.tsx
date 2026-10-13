import { CardsSection } from "@/components/sections/cards";
import { ContactSection } from "@/components/sections/contact";
import { HeroSection } from "@/components/sections/hero";
import { Feature43Section } from "@/components/sections/shadcnblocks/cards";
import { Cta10Section } from "@/components/sections/shadcnblocks/contact";
import { Hero115Section } from "@/components/sections/shadcnblocks/hero";
import { Process1Section } from "@/components/sections/shadcnblocks/steps";
import { About29Section } from "@/components/sections/shadcnblocks/text";
import { StepsSection } from "@/components/sections/steps";
import { TextSection } from "@/components/sections/text";
import {
  enabledHomeSections,
  type HomeDesign,
  type HomeSection,
} from "@/config/home";

// One component per design for each layout type; a design missing from any
// of these fails to compile.
const heroes = {
  velora: HeroSection,
  shadcnblocks: Hero115Section,
} satisfies Record<HomeDesign, unknown>;
const cards = {
  velora: CardsSection,
  shadcnblocks: Feature43Section,
} satisfies Record<HomeDesign, unknown>;
const steps = {
  velora: StepsSection,
  shadcnblocks: Process1Section,
} satisfies Record<HomeDesign, unknown>;
const texts = {
  velora: TextSection,
  shadcnblocks: About29Section,
} satisfies Record<HomeDesign, unknown>;
const contacts = {
  velora: ContactSection,
  shadcnblocks: Cta10Section,
} satisfies Record<HomeDesign, unknown>;

function renderSection(section: HomeSection) {
  switch (section.type) {
    case "hero": {
      const Hero = heroes[section.design];
      return <Hero key={section.id} id={section.id} />;
    }
    case "cards": {
      const Cards = cards[section.design];
      return <Cards key={section.id} id={section.id} icons={section.icons} />;
    }
    case "steps": {
      const Steps = steps[section.design];
      return <Steps key={section.id} id={section.id} />;
    }
    case "text": {
      const Text = texts[section.design];
      return <Text key={section.id} id={section.id} />;
    }
    case "contact": {
      const Contact = contacts[section.design];
      return <Contact key={section.id} id={section.id} />;
    }
    default: {
      // A layout type added to HomeSection without a branch here fails to compile.
      const unhandled: never = section;
      return unhandled;
    }
  }
}

/** The home page body, composed from `src/config/home.ts`. */
export function HomeSections() {
  return <>{enabledHomeSections.map(renderSection)}</>;
}
