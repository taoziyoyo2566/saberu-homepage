// Free block "Feature 43" from shadcnblocks.com, Base UI variant
// (https://www.shadcnblocks.com/r/base-nova/feature43); terms in
// THIRD_PARTY_NOTICES.md. Changed here: no demo defaults, so missing copy
// cannot fall back to invented claims; an optional description under the
// heading; the button is an anchor styled with `buttonVariants`, which keeps
// its link role.
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button-variants";

interface FeatureIconListItem {
  title: string;
  description: string;
  icon?: React.ReactNode;
}
interface Button {
  text: string;
  url: string;
}
interface Buttons {
  primary?: Button;
}

interface Feature43Props {
  heading: string;
  description?: string;
  features: FeatureIconListItem[];
  buttons?: Buttons;
  className?: string;
}

const MAX_FEATURES = 6;

const Feature43 = ({
  heading,
  description,
  buttons,
  features,
  className,
}: Feature43Props) => {
  const items = features.slice(0, MAX_FEATURES);

  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-pretty lg:text-5xl">
            {heading}
          </h2>
          {description && (
            <p className="mt-4 text-muted-foreground lg:text-lg">
              {description}
            </p>
          )}
        </div>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {items.map((feature, i) => (
            <div key={i} className="flex flex-col">
              <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-accent">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-xl font-medium">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
        {buttons?.primary && (
          <div className="mt-16 flex justify-center">
            <a
              href={buttons.primary.url}
              className={buttonVariants({ size: "lg" })}
            >
              {buttons.primary.text}
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export { Feature43 };
