// Adapted from Velora UI (MIT); see THIRD_PARTY_NOTICES.md.
import { useId } from "react";

import { cx } from "./cx";

interface PatternProps {
  readonly className?: string;
}

/** A hairline grid filling its positioned parent; fade it with a mask class. */
export function GridPattern({
  size = 48,
  className,
}: PatternProps & { readonly size?: number }) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      className={cx(
        "pointer-events-none absolute inset-0 size-full fill-none stroke-line",
        className,
      )}
    >
      <defs>
        <pattern
          id={id}
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
          x={-1}
          y={-1}
        >
          <path d={`M.5 ${size}V.5H${size}`} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  );
}

/** A dot lattice filling its positioned parent; fade it with a mask class. */
export function DotPattern({ className }: PatternProps) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      className={cx(
        "pointer-events-none absolute inset-0 size-full fill-muted/30",
        className,
      )}
    >
      <defs>
        <pattern id={id} width={20} height={20} patternUnits="userSpaceOnUse">
          <circle cx={1} cy={1} r={1} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  );
}
