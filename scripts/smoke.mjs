#!/usr/bin/env node
/**
 * HTTP smoke checks for a running instance (local container or production).
 *
 *   npm run smoke -- [baseUrl]
 *
 * Expected values come from the sources the app itself uses: the locale
 * registry and site facts (`src/config/*.ts`, imported through Node's
 * TypeScript type stripping) and the message catalogs (`messages/*.json`).
 * Run it from the checkout that produced the target build.
 *
 * Environment:
 *   SMOKE_BASE_URL        target when no argument is given (http://127.0.0.1:3000)
 *   SMOKE_TRUST_COUNTRY   "true" when the target runs with TRUST_CF_IPCOUNTRY=true
 *   SMOKE_SITE_URL        canonical origin expected in metadata (defaults to site.url)
 */
import { readFile } from "node:fs/promises";

const projectRoot = new URL("../", import.meta.url);
const { locales, defaultLocale, preferenceCookie } = await import(
  new URL("src/config/locales.ts", projectRoot).href
);
const { site } = await import(new URL("src/config/site.ts", projectRoot).href);
const messages = Object.fromEntries(
  await Promise.all(
    locales.map(async ({ id }) => [
      id,
      JSON.parse(
        await readFile(new URL(`messages/${id}.json`, projectRoot), "utf8"),
      ),
    ]),
  ),
);

const base = (
  process.argv[2] ??
  process.env.SMOKE_BASE_URL ??
  "http://127.0.0.1:3000"
).replace(/\/$/, "");
const siteUrl = (process.env.SMOKE_SITE_URL ?? site.url).replace(/\/$/, "");
const trustCountry = process.env.SMOKE_TRUST_COUNTRY === "true";
const cookieName = preferenceCookie.name;

let failures = 0;

async function check(name, run) {
  try {
    await run();
    console.log(`ok    ${name}`);
  } catch (error) {
    failures += 1;
    console.log(
      `FAIL  ${name}\n      ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function get(path, init = {}) {
  return fetch(`${base}${path}`, { redirect: "manual", ...init });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtml(text) {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
}

function expectEqual(actual, expected, what) {
  if (actual !== expected) {
    throw new Error(
      `${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

function expectMatch(text, pattern, what) {
  if (!pattern.test(text ?? "")) {
    throw new Error(`${what}: ${pattern} not found`);
  }
}

function expectAbsent(text, pattern, what) {
  if (pattern.test(text ?? "")) {
    throw new Error(`${what}: ${pattern} must not appear`);
  }
}

/** Decoded content of the first match group, or a failure naming what is missing. */
function extract(html, pattern, what) {
  const match = html.match(pattern);
  if (!match) {
    throw new Error(`${what}: ${pattern} not found`);
  }
  return decodeHtml(match[1]);
}

function meta(html, attribute, key) {
  return extract(
    html,
    new RegExp(`<meta ${attribute}="${escapeRegExp(key)}" content="([^"]*)"`),
    `${attribute}=${key}`,
  );
}

function locationPath(response) {
  const location = response.headers.get("location");
  if (!location) {
    throw new Error("missing Location header");
  }
  const url = new URL(location, base);
  return `${url.pathname}${url.search}`;
}

async function expectRedirect(path, headers, expectedPath, what) {
  const response = await get(path, { headers });
  expectEqual(response.status, 307, `${what}: status`);
  expectEqual(locationPath(response), expectedPath, `${what}: location`);
  expectMatch(
    response.headers.get("cache-control"),
    /no-store/,
    `${what}: cache-control`,
  );
}

function expectSecurityHeaders(response, what) {
  expectEqual(
    response.headers.get("x-content-type-options"),
    "nosniff",
    `${what}: nosniff`,
  );
  expectMatch(
    response.headers.get("referrer-policy"),
    /strict-origin-when-cross-origin/,
    `${what}: referrer-policy`,
  );
  expectMatch(
    response.headers.get("permissions-policy"),
    /camera=\(\)/,
    `${what}: permissions-policy`,
  );
  expectMatch(
    response.headers.get("content-security-policy"),
    /frame-ancestors 'self'/,
    `${what}: csp`,
  );
  expectEqual(
    response.headers.get("x-powered-by"),
    null,
    `${what}: x-powered-by`,
  );
}

async function expectImage(path, what) {
  const response = await get(path);
  expectEqual(response.status, 200, `${what}: status`);
  expectEqual(
    response.headers.get("content-type"),
    "image/png",
    `${what}: content-type`,
  );
  const bytes = (await response.arrayBuffer()).byteLength;
  if (bytes < 1000) {
    throw new Error(`${what}: suspiciously small image (${bytes} bytes)`);
  }
}

function pathOf(url) {
  const parsed = new URL(url, base);
  return `${parsed.pathname}${parsed.search}`;
}

// Root path negotiation.
await check("root: Japanese browser is sent to /ja", () =>
  expectRedirect(
    "/",
    { "accept-language": "ja-JP,ja;q=0.9,en;q=0.8" },
    "/ja",
    "ja browser",
  ),
);
await check("root: the query string survives the redirect", () =>
  expectRedirect(
    "/?utm=x&y=1",
    { "accept-language": "en-US,en;q=0.9" },
    "/en?utm=x&y=1",
    "query",
  ),
);
await check("root: browser language beats the country", () =>
  expectRedirect(
    "/",
    { "accept-language": "zh-CN,zh;q=0.9", "cf-ipcountry": "JP" },
    "/zh",
    "zh+JP",
  ),
);
await check(
  `root: unmatched browser language with country JP goes to ${trustCountry ? "/ja (trusted)" : `/${defaultLocale} (country untrusted)`}`,
  () =>
    expectRedirect(
      "/",
      { "accept-language": "fr-FR,fr;q=0.9", "cf-ipcountry": "JP" },
      trustCountry ? "/ja" : `/${defaultLocale}`,
      "fr+JP",
    ),
);
await check("root: a valid preference cookie wins over the browser", () =>
  expectRedirect(
    "/",
    { "accept-language": "ja", cookie: `${cookieName}=zh` },
    "/zh",
    "cookie",
  ),
);
await check("root: an invalid preference cookie is ignored", () =>
  expectRedirect(
    "/",
    { "accept-language": "ja", cookie: `${cookieName}=../etc` },
    "/ja",
    "bad cookie",
  ),
);
await check("root: a damaged Accept-Language header still gets an answer", () =>
  expectRedirect(
    "/",
    { "accept-language": ";;;=,q=,*;q=9" },
    `/${defaultLocale}`,
    "garbage header",
  ),
);
await check(
  "root: no information at all falls back to the default locale",
  () => expectRedirect("/", {}, `/${defaultLocale}`, "nothing"),
);

// Language pages.
for (const locale of locales) {
  const copy = messages[locale.id];
  await check(
    `/${locale.id}: 200, language, SEO, share metadata and security headers`,
    async () => {
      // A conflicting preference cookie must not change a language URL.
      const other = locales.find((entry) => entry.id !== locale.id);
      const response = await get(`/${locale.id}`, {
        headers: { cookie: `${cookieName}=${other.id}` },
      });
      expectEqual(response.status, 200, "status");
      expectMatch(
        response.headers.get("content-type"),
        /text\/html/,
        "content-type",
      );
      expectSecurityHeaders(response, "headers");
      const html = await response.text();

      expectMatch(
        html,
        new RegExp(`<html[^>]*\\blang="${locale.tag}"`),
        "html lang",
      );
      expectEqual(
        extract(html, /<title>([^<]*)<\/title>/, "title"),
        copy.metadata.title,
        "title",
      );
      expectEqual(
        meta(html, "name", "description"),
        copy.metadata.description,
        "description",
      );
      expectMatch(
        html,
        new RegExp(
          `<link rel="canonical" href="${escapeRegExp(`${siteUrl}/${locale.id}`)}"`,
        ),
        "canonical",
      );
      for (const entry of locales) {
        expectMatch(
          html,
          new RegExp(
            `<link rel="alternate" hrefLang="${entry.tag}" href="${escapeRegExp(`${siteUrl}/${entry.id}`)}"`,
          ),
          `hreflang ${entry.tag}`,
        );
      }
      expectMatch(
        html,
        new RegExp(
          `<link rel="alternate" hrefLang="x-default" href="${escapeRegExp(siteUrl)}/?"`,
        ),
        "x-default",
      );
      expectAbsent(html, /noindex/, "noindex");

      expectEqual(
        meta(html, "property", "og:title"),
        copy.metadata.title,
        "og:title",
      );
      expectEqual(
        meta(html, "property", "og:description"),
        copy.metadata.description,
        "og:description",
      );
      expectEqual(
        meta(html, "property", "og:url"),
        `${siteUrl}/${locale.id}`,
        "og:url",
      );
      expectEqual(
        meta(html, "property", "og:site_name"),
        site.name,
        "og:site_name",
      );
      expectEqual(meta(html, "property", "og:type"), "website", "og:type");
      expectEqual(
        meta(html, "property", "og:locale"),
        locale.ogLocale,
        "og:locale",
      );
      const alternates = [
        ...html.matchAll(
          /<meta property="og:locale:alternate" content="([^"]*)"/g,
        ),
      ].map((match) => match[1]);
      expectEqual(
        alternates.sort().join(","),
        locales
          .filter((entry) => entry.id !== locale.id)
          .map((entry) => entry.ogLocale)
          .sort()
          .join(","),
        "og:locale:alternate",
      );
      expectEqual(
        meta(html, "property", "og:image:width"),
        "1200",
        "og:image:width",
      );
      expectEqual(
        meta(html, "property", "og:image:height"),
        "630",
        "og:image:height",
      );
      expectEqual(
        meta(html, "property", "og:image:type"),
        "image/png",
        "og:image:type",
      );
      const ogImage = new URL(meta(html, "property", "og:image"));
      if (
        ogImage.origin !== siteUrl ||
        ogImage.pathname !== `/${locale.id}/opengraph-image`
      ) {
        throw new Error(`og:image: unexpected ${ogImage.href}`);
      }
      expectEqual(
        meta(html, "name", "twitter:card"),
        "summary_large_image",
        "twitter:card",
      );
      // Next.js copies the share image into the Twitter metadata when no twitter-image exists.
      expectEqual(
        meta(html, "name", "twitter:image"),
        ogImage.href,
        "twitter:image",
      );

      // Content isolation across locales: no other language's title in this page.
      const decoded = decodeHtml(html);
      for (const entry of locales) {
        if (
          entry.id !== locale.id &&
          decoded.includes(messages[entry.id].metadata.title)
        ) {
          throw new Error(`title of ${entry.id} appears in /${locale.id}`);
        }
      }

      // Primary action and in-page navigation.
      expectMatch(
        html,
        new RegExp(`href="mailto:${escapeRegExp(site.contactEmail)}"`),
        "mailto",
      );
      const anchors = [
        ...html.matchAll(new RegExp(`href="/${locale.id}#([a-z0-9-]+)"`, "g")),
      ].map((match) => match[1]);
      if (anchors.length === 0) {
        throw new Error("navigation: no in-page links found");
      }
      for (const anchor of new Set(anchors)) {
        expectMatch(
          html,
          new RegExp(`\\bid="${anchor}"`),
          `navigation target #${anchor}`,
        );
      }
    },
  );
}

await check("share image and app icon are served as PNG", async () => {
  const html = await (await get(`/${defaultLocale}`)).text();
  await expectImage(pathOf(meta(html, "property", "og:image")), "og:image");
  const appleIcon = extract(
    html,
    /<link rel="apple-touch-icon" href="([^"]*)"/,
    "apple-touch-icon",
  );
  await expectImage(pathOf(appleIcon), "apple-touch-icon");
});

await check("/icon.svg is served as an image", async () => {
  const response = await get("/icon.svg");
  expectEqual(response.status, 200, "status");
  expectMatch(
    response.headers.get("content-type"),
    /image\/svg\+xml/,
    "content-type",
  );
});

// Not found handling.
for (const path of [
  "/about",
  "/fr",
  "/ja/missing",
  "/fr/opengraph-image",
  "/zh/a/b/c",
  "/missing.png",
  "/healthz-extra",
]) {
  await check(
    `${path}: real 404 with noindex and no home alternates`,
    async () => {
      const response = await get(path, {
        headers: { "accept-language": "ja" },
      });
      expectEqual(response.status, 404, "status");
      const html = await response.text();
      if (/text\/html/.test(response.headers.get("content-type") ?? "")) {
        expectMatch(html, /noindex/, "noindex");
        expectAbsent(html, /rel="canonical"/, "canonical");
        expectAbsent(html, /hrefLang=/i, "hreflang");
        expectAbsent(html, /og:url/, "og:url");
      }
    },
  );
}

// Paths that only resemble excluded routes must still reach the proxy.
for (const path of [
  "/about",
  "/fr",
  "/404",
  "/healthz-extra",
  "/healthz/x",
  "/apple-icon/x",
]) {
  await check(
    `${path}: 404 document in the default locale with a link home`,
    async () => {
      const response = await get(path, {
        headers: { "accept-language": "ja" },
      });
      expectEqual(response.status, 404, "status");
      const html = await response.text();
      const fallback = locales.find((entry) => entry.id === defaultLocale);
      expectMatch(
        html,
        new RegExp(`<html[^>]*\\blang="${fallback.tag}"`),
        "html lang",
      );
      expectEqual(
        extract(html, /<h1>([^<]*)<\/h1>/, "heading"),
        messages[defaultLocale].notFound.title,
        "heading",
      );
      expectMatch(html, new RegExp(`href="/${defaultLocale}"`), "home link");
      expectMatch(html, /<link rel="icon" href="\/icon\.svg"/, "site icon");
      expectEqual(
        response.headers.get("cache-control"),
        "no-store",
        "cache-control",
      );
      expectAbsent(html, new RegExp(escapeRegExp(path)), "path echo");
    },
  );
}

for (const locale of locales) {
  await check(
    `/${locale.id}/missing: 404 document in ${locale.id}`,
    async () => {
      const response = await get(`/${locale.id}/missing`);
      expectEqual(response.status, 404, "status");
      const html = await response.text();
      expectMatch(
        html,
        new RegExp(`<html[^>]*\\blang="${locale.tag}"`),
        "html lang",
      );
      expectEqual(
        extract(html, /<h1>([^<]*)<\/h1>/, "heading"),
        messages[locale.id].notFound.title,
        "heading",
      );
    },
  );
}

// Crawling and operations.
await check(
  "/sitemap.xml lists every language of the home page with full alternates",
  async () => {
    const response = await get("/sitemap.xml");
    expectEqual(response.status, 200, "status");
    expectMatch(response.headers.get("content-type"), /xml/, "content-type");
    const xml = await response.text();
    for (const locale of locales) {
      expectMatch(
        xml,
        new RegExp(`<loc>${escapeRegExp(`${siteUrl}/${locale.id}`)}</loc>`),
        `loc ${locale.id}`,
      );
      expectMatch(
        xml,
        new RegExp(
          `hreflang="${locale.tag}" href="${escapeRegExp(`${siteUrl}/${locale.id}`)}"`,
        ),
        `alternate ${locale.tag}`,
      );
    }
    expectMatch(
      xml,
      new RegExp(`hreflang="x-default" href="${escapeRegExp(siteUrl)}/?"`),
      "x-default",
    );
    expectEqual(
      (xml.match(/<url>/g) ?? []).length,
      locales.length,
      "url count",
    );
  },
);

await check(
  "/robots.txt allows crawling and points at the sitemap",
  async () => {
    const response = await get("/robots.txt");
    expectEqual(response.status, 200, "status");
    const text = await response.text();
    expectMatch(text, /Allow: \//, "allow");
    expectMatch(
      text,
      new RegExp(`Sitemap: ${escapeRegExp(siteUrl)}/sitemap.xml`),
      "sitemap",
    );
  },
);

await check("/healthz answers JSON without caching", async () => {
  const response = await get("/healthz");
  expectEqual(response.status, 200, "status");
  expectMatch(
    response.headers.get("cache-control"),
    /no-store/,
    "cache-control",
  );
  expectEqual((await response.json()).status, "ok", "body");
});

await check(
  "hashed static assets are served with a long immutable cache",
  async () => {
    const html = await (await get(`/${defaultLocale}`)).text();
    const match = html.match(/\/_next\/static\/[^"']+\.js/);
    if (!match) {
      throw new Error("no /_next/static script found in the page");
    }
    const response = await get(match[0]);
    expectEqual(response.status, 200, "status");
    expectMatch(
      response.headers.get("cache-control"),
      /immutable/,
      "cache-control",
    );
  },
);

await check("/zh/ (trailing slash) redirects to /zh", async () => {
  const response = await get("/zh/");
  expectEqual(response.status, 308, "status");
  expectEqual(locationPath(response), "/zh", "location");
});

console.log(
  failures === 0
    ? `\nall smoke checks passed against ${base}`
    : `\n${failures} smoke check(s) failed against ${base}`,
);
process.exit(failures === 0 ? 0 : 1);
