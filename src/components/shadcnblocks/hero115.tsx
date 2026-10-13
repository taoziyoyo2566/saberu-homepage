// Free block "Hero 115" from shadcnblocks.com, Base UI variant
// (https://www.shadcnblocks.com/r/base-nova/hero115); terms in
// THIRD_PARTY_NOTICES.md. Changed here: no demo defaults, so missing copy
// cannot fall back to invented claims; no image, as the site has none; the
// secondary button is rendered; buttons are anchors styled with
// `buttonVariants`, which keeps their link role.
import { ArrowRight } from "lucide-react";
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

interface Hero115Props {
  heading: string;
  description: string;
  buttons?: Buttons;
  byline?: string;
  className?: string;
  icon?: React.ReactNode;
}

const Hero115 = ({
  icon,
  heading,
  description,
  buttons,
  byline,
  className,
}: Hero115Props) => {
  return (
    <section className={cn("overflow-hidden py-32", className)}>
      <div className="container mx-auto">
        <div className="flex flex-col gap-5">
          <div className="relative isolate flex flex-col gap-5">
            <div
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-1/2 -z-10 mx-auto size-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border mask-[linear-gradient(to_top,transparent,transparent,white,white,white,transparent,transparent)] p-16 [-webkit-mask-image:linear-gradient(to_top,transparent,transparent,white,white,white,transparent,transparent)] md:size-[1300px] md:p-32"
            >
              <div className="size-full rounded-full border border-border p-16 md:p-32">
                <div className="size-full rounded-full border border-border" />
              </div>
            </div>
            {icon && (
              <span className="mx-auto flex size-16 items-center justify-center rounded-full border md:size-20">
                {icon}
              </span>
            )}
            <h1 className="mx-auto max-w-xl text-center text-4xl font-semibold tracking-tight text-pretty md:text-5xl lg:max-w-3xl lg:text-6xl">
              {heading}
            </h1>
            <p className="mx-auto max-w-5xl text-center text-lg text-balance text-muted-foreground md:text-xl">
              {description}
            </p>
            <div className="flex flex-col items-center gap-3 pt-3 pb-12">
              {buttons?.primary && (
                <a
                  href={buttons.primary.url}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "w-full sm:w-auto",
                  )}
                >
                  {buttons.primary.text}
                  <ArrowRight className="size-4" />
                </a>
              )}
              {buttons?.secondary && (
                <a
                  href={buttons.secondary.url}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full sm:w-auto",
                  )}
                >
                  {buttons.secondary.text}
                </a>
              )}
              {byline && (
                <div className="text-center text-sm text-muted-foreground">
                  {byline}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Hero115 };
