import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { BrandMark, brandColors } from "@/components/brand-mark";
import { localeIds } from "@/config/locales";
import { site } from "@/config/site";

/**
 * Share image for the pages of each language. It lives in the same segment as
 * the pages because a page that sets `openGraph` replaces the whole field
 * inherited from parent segments. The image carries only the brand, so it
 * never drifts from the translated titles; it is rendered at build time.
 */
export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// One prerendered image per language, so the route never renders at request time.
export function generateStaticParams() {
  return localeIds.map((locale) => ({ locale }));
}

const geistSemiBold = await readFile(
  join(
    process.cwd(),
    "node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.ttf",
  ),
);

export default function OpenGraphImage() {
  const host = new URL(site.url).host;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 56,
        padding: "0 120px",
        background: brandColors.ink,
        fontFamily: "Geist",
      }}
    >
      <BrandMark size={168} rounded />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 132,
            color: brandColors.paper,
            letterSpacing: -4,
            lineHeight: 1,
          }}
        >
          {site.name}
        </div>
        <div style={{ marginTop: 24, fontSize: 40, color: brandColors.muted }}>
          {host}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Geist", data: geistSemiBold, style: "normal", weight: 600 },
      ],
    },
  );
}
