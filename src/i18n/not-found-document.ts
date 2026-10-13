import { getLocaleDefinition, type Locale } from "@/config/locales";
import { site } from "@/config/site";

type Messages = typeof import("../../messages/en.json");

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/*
 * Colour values mirror the tokens in src/app/globals.css, which remains the
 * canonical owner; the proxy cannot load the built stylesheet.
 */
const STYLE =
  ":root{color-scheme:light dark;--background:#ffffff;--foreground:#0a0a0a;--muted-foreground:#737373;--border:#e5e5e5;--primary:#155dfc}" +
  "@media (prefers-color-scheme:dark){:root{--background:#0a0a0a;--foreground:#fafafa;--muted-foreground:#a1a1a1;--border:#262626;--primary:#2b7fff}}" +
  "body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--background);color:var(--foreground);font-family:system-ui,sans-serif;line-height:1.6}" +
  "main{max-width:40rem}h1{font-size:1.75rem;margin:.5rem 0 1rem}p{margin:0;color:var(--muted-foreground)}" +
  "a{display:inline-block;margin-top:1.5rem;padding:.5rem 1.25rem;border:1px solid var(--border);border-radius:999px;color:var(--primary);text-decoration:none}" +
  "a:focus-visible{outline:2px solid var(--primary);outline-offset:2px}";

/**
 * The complete 404 document the proxy returns for unknown document paths. It is
 * server-rendered, localized, carries a real 404 status and never echoes the
 * requested path. Copy comes from `messages/<locale>.json`.
 */
export async function renderNotFoundDocument(locale: Locale): Promise<string> {
  const { notFound } = (
    (await import(`../../messages/${locale}.json`)) as { default: Messages }
  ).default;
  const { tag } = getLocaleDefinition(locale);
  const title = escapeHtml(notFound.title);
  return (
    "<!doctype html>" +
    `<html lang="${escapeHtml(tag)}"><head><meta charset="utf-8">` +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="robots" content="noindex">' +
    '<link rel="icon" href="/icon.svg" type="image/svg+xml">' +
    `<title>${title} | ${escapeHtml(site.name)}</title><style>${STYLE}</style></head>` +
    `<body><main><p>404</p><h1>${title}</h1><p>${escapeHtml(notFound.description)}</p>` +
    `<a href="/${locale}">${escapeHtml(notFound.backHome)}</a></main></body></html>`
  );
}
