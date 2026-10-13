// Adapted from Velora UI's ShimmerButton (MIT); see THIRD_PARTY_NOTICES.md.
// A link rather than a button: every call to action on the site navigates.
import type { ReactNode } from "react";

// Sizes are variants rather than class overrides: without class merging, two
// utilities for the same property would resolve by stylesheet order.
const sizeClass = {
  default: "h-12 px-8 text-sm",
  large: "h-14 px-10 text-base",
} as const;

interface ShimmerLinkProps {
  readonly href: string;
  readonly children: ReactNode;
  readonly size?: keyof typeof sizeClass;
}

export function ShimmerLink({
  href,
  children,
  size = "default",
}: ShimmerLinkProps) {
  return (
    <a
      href={href}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-accent font-medium text-accent-fg shadow-lg shadow-accent/30 transition-[transform,box-shadow] duration-300 hover:shadow-xl hover:shadow-accent/40 active:scale-[0.98] motion-safe:hover:scale-[1.03] ${sizeClass[size]}`}
    >
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.35)_50%,transparent_70%)] bg-[length:250%_100%] motion-safe:animate-shimmer"
      />
    </a>
  );
}
