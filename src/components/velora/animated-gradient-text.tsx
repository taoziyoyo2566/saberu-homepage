// Adapted from Velora UI (MIT); see THIRD_PARTY_NOTICES.md.
import type { ReactNode } from "react";

/** Text filled with the brand ramp, which drifts slowly when motion is allowed. */
export function AnimatedGradientText({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <span className="inline-block bg-gradient-to-r from-brand-from via-brand-via to-brand-to bg-[length:300%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
      {children}
    </span>
  );
}
