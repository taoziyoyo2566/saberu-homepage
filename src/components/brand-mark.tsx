/**
 * The saberu mark. Used by the header (theme colours through CSS variables)
 * and by the generated app icon and share image (fixed colours, because the
 * image renderer has no stylesheet). `src/app/icon.svg` repeats the same
 * geometry on the 64-unit grid as a static file; keep the two in step.
 */
export const brandColors = {
  accent: "#0a6c86",
  ink: "#0f151b",
  paper: "#ffffff",
  muted: "#9aa8b5",
} as const;

interface BrandMarkProps {
  readonly size: number;
  readonly rounded: boolean;
  readonly background?: string;
  readonly foreground?: string;
}

export function BrandMark({
  size,
  rounded,
  background = brandColors.accent,
  foreground = brandColors.paper,
}: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        width="64"
        height="64"
        rx={rounded ? 14 : 0}
        style={{ fill: background }}
      />
      <path
        d="M19 45 L45 19"
        strokeWidth={6.5}
        strokeLinecap="round"
        style={{ stroke: foreground }}
      />
      <circle cx="45" cy="45" r="4.5" style={{ fill: foreground }} />
    </svg>
  );
}
