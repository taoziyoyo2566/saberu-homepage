import { localeIds } from "@/config/locales";

/**
 * Published public pages, without locale prefix. The proxy serves only these
 * (other paths get the 404 document) and the sitemap lists them; header
 * navigation is separate (`homeNavSectionIds` in src/config/home.ts).
 */
export interface PublicPage {
  /** Absolute path without locale prefix; `/` is the home page. */
  readonly path: string;
}

export const publicPages: readonly PublicPage[] = [{ path: "/" }];

const PATH_PATTERN = /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/;

/** Lists every defect in a page list; an empty list means valid. */
export function findPublicPagesErrors(
  pages: readonly PublicPage[],
  reservedPrefixes: readonly string[],
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const page of pages) {
    if (!PATH_PATTERN.test(page.path)) {
      errors.push(
        `path "${page.path}" must be absolute, lowercase and without a trailing slash`,
      );
    }
    if (seen.has(page.path)) {
      errors.push(`path "${page.path}" is listed twice`);
    }
    seen.add(page.path);
    const firstSegment = page.path.split("/")[1];
    if (firstSegment !== undefined && reservedPrefixes.includes(firstSegment)) {
      errors.push(`path "${page.path}" must not start with a locale prefix`);
    }
  }
  if (!seen.has("/")) {
    errors.push('the home page "/" must be listed');
  }
  return errors;
}

export function assertPublicPages(
  pages: readonly PublicPage[],
  reservedPrefixes: readonly string[],
): void {
  const errors = findPublicPagesErrors(pages, reservedPrefixes);
  if (errors.length > 0) {
    throw new Error(`Invalid public page list:\n- ${errors.join("\n- ")}`);
  }
}

assertPublicPages(publicPages, localeIds);
