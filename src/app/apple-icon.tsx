import { ImageResponse } from "next/og";

import { BrandMark } from "@/components/brand-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS applies its own corner mask, so the mark is drawn full-bleed.
export default function AppleIcon() {
  return new ImageResponse(<BrandMark size={size.width} rounded={false} />, {
    ...size,
  });
}
