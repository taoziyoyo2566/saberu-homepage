// Free block "Cta 10" from shadcnblocks.com, Base UI variant
// (https://www.shadcnblocks.com/r/base-nova/cta10); terms in
// THIRD_PARTY_NOTICES.md. Changed here: no demo defaults, so missing copy
// cannot fall back to invented claims; buttons are anchors styled with
// `buttonVariants`, which keeps their link role.
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button-variants";

interface Button {
  text: string;
  url: string;
}
interface Buttons {
  primary?: Button;
  secondary?: Button;
}

interface Cta10Props {
  heading: string;
  description: string;
  buttons?: Buttons;
  className?: string;
}

const Cta10 = ({ heading, description, buttons, className }: Cta10Props) => {
  return (
    <section className={cn("py-12 md:py-16 lg:py-32", className)}>
      <div className="container mx-auto">
        <div className="mx-auto flex w-full flex-col gap-16 overflow-hidden rounded-lg bg-accent p-8 md:rounded-xl lg:flex-row lg:items-center lg:p-12">
          <div className="flex flex-1 flex-col gap-3 md:gap-4 lg:gap-6">
            <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">
              {heading}
            </h2>
            <p className="max-w-xl text-muted-foreground lg:text-lg">
              {description}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            {buttons?.secondary && (
              <a
                href={buttons.secondary.url}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                {buttons.secondary.text}
              </a>
            )}
            {buttons?.primary && (
              <a
                href={buttons.primary.url}
                className={buttonVariants({ size: "lg" })}
              >
                {buttons.primary.text}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export { Cta10 };
