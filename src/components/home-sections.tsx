import { CardsSection } from "@/components/sections/cards";
import { ContactSection } from "@/components/sections/contact";
import { HeroSection } from "@/components/sections/hero";
import { StepsSection } from "@/components/sections/steps";
import { TextSection } from "@/components/sections/text";
import { enabledHomeSections, type HomeSection } from "@/config/home";

function renderSection(section: HomeSection) {
  switch (section.type) {
    case "hero":
      return <HeroSection key={section.id} id={section.id} />;
    case "cards":
      return (
        <CardsSection key={section.id} id={section.id} icons={section.icons} />
      );
    case "steps":
      return <StepsSection key={section.id} id={section.id} />;
    case "text":
      return <TextSection key={section.id} id={section.id} />;
    case "contact":
      return <ContactSection key={section.id} id={section.id} />;
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
