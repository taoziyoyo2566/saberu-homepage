// Free block "Process 1" from shadcnblocks.com, Base UI variant
// (https://www.shadcnblocks.com/r/base-nova/process1); terms in
// THIRD_PARTY_NOTICES.md. Upstream hard-codes its copy; here the heading,
// description, steps and button are props. Also changed: the heading is an
// h2 (the hero holds the page's h1); the orange and red marks use the theme's
// primary colour; the sticky column clears the site's sticky header; the
// button is an anchor styled with `buttonVariants`, which keeps its link role.
import { Asterisk, CornerDownRight } from "lucide-react";
import React from "react";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button-variants";

interface ProcessStep {
  title: string;
  description: string;
}

interface Process1Props {
  heading: string;
  description?: string;
  steps: ProcessStep[];
  button?: { text: string; url: string };
  className?: string;
}

const Process1 = ({
  heading,
  description,
  steps,
  button,
  className,
}: Process1Props) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-6 lg:gap-20">
          <div className="top-24 col-span-2 h-fit w-fit gap-3 space-y-7 py-8 lg:sticky">
            <div className="relative w-fit text-5xl font-semibold tracking-tight lg:text-7xl">
              <h2 className="w-fit">{heading}</h2>
              <Asterisk className="absolute -top-2 -right-2 size-5 text-primary md:size-10 lg:-right-14" />
            </div>
            {description && (
              <p className="text-base text-foreground/50">{description}</p>
            )}
            {button && (
              <a
                href={button.url}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "flex items-center justify-start gap-2",
                )}
              >
                <CornerDownRight className="text-primary" />
                {button.text}
              </a>
            )}
          </div>
          <ul className="relative col-span-4 w-full lg:pl-22">
            {steps.map((step, index) => (
              <li
                key={index}
                className="relative flex flex-col justify-between gap-10 border-t py-8 md:flex-row lg:py-10"
              >
                <Illustration className="absolute top-4 right-0 text-primary" />

                <div className="flex size-12 items-center justify-center bg-muted px-4 py-1 tracking-tighter">
                  0{index + 1}
                </div>
                <div className="">
                  <h3 className="mb-4 text-2xl font-semibold tracking-tighter lg:text-3xl">
                    {step.title}
                  </h3>
                  <p className="text-foreground/50">{step.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export { Process1 };

const Illustration = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="22"
      height="20"
      viewBox="0 0 22 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <line
        x1="0.607422"
        y1="2.57422"
        x2="21.5762"
        y2="2.57422"
        stroke="currentColor"
        strokeWidth="4"
      />
      <line
        x1="19.5762"
        y1="19.624"
        x2="19.5762"
        y2="4.57422"
        stroke="currentColor"
        strokeWidth="4"
      />
    </svg>
  );
};
