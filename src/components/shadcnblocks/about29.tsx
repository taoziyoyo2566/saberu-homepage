// Free block "About 29" from shadcnblocks.com, Base UI variant
// (https://www.shadcnblocks.com/r/base-nova/about29); terms in
// THIRD_PARTY_NOTICES.md. Changed here: no demo defaults, so missing copy
// cannot fall back to invented claims; only the heading, description and
// text columns remain, because the photo and mission panels need images the
// site does not have; `sections` feeds the columns alone.
import { cn } from "cn";

interface AboutBasicSection {
  title: string;
  content: string;
}

interface About29Props {
  heading: string;
  description?: string;
  sections?: AboutBasicSection[];
  className?: string;
}

const MAX_COLUMNS = 3;
const COLUMN_CHARS = 160;

const truncate = (content: string) => {
  if (content.length <= COLUMN_CHARS) {
    return content;
  }
  return `${content.slice(0, COLUMN_CHARS).trimEnd()}…`;
};

const About29 = ({
  heading,
  description,
  sections,
  className,
}: About29Props) => {
  const columns = (sections ?? []).slice(0, MAX_COLUMNS);

  return (
    <section className={cn("py-32", className)}>
      <div className="container mx-auto">
        <div className="flex flex-col gap-16 lg:gap-28">
          <div className="flex flex-col gap-4 lg:gap-8">
            <h2 className="max-w-3xl text-4xl font-semibold tracking-tighter lg:text-7xl">
              {heading}
            </h2>
            {description && (
              <p className="max-w-xl text-xl leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {columns.length > 0 && (
            <div className="grid gap-10 md:grid-cols-3 md:gap-12">
              {columns.map((section) => (
                <div
                  key={section.title}
                  className="flex flex-col gap-3 border-t border-border pt-6"
                >
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                  <p className="text-muted-foreground">
                    {truncate(section.content)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export { About29 };
