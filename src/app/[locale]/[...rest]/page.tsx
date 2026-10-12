import { notFound } from "next/navigation";

/**
 * Safety net for paths under a supported locale that bypass the proxy (for
 * example `/ja/file.txt`): a real 404 whose UI is completed by client-side
 * JavaScript, the best Next.js 16.4 offers for `notFound()` under Cache
 * Components. Ordinary document paths never get here; the proxy answers them.
 */
export default function CatchAllPage() {
  notFound();
}
