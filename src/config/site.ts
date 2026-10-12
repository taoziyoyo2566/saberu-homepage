/**
 * Brand and site facts that are not translated. Maintainers change them
 * through code review; translated copy lives in `messages/`.
 */

export interface SiteLink {
  /** Visible label; brand names are not translated. */
  readonly label: string;
  readonly href: string;
}

/**
 * Who stands behind the copy in `messages/` and the values below:
 * - "placeholder": layout filler for development;
 * - "demo": drafted copy that the brand owner has not confirmed;
 * - "confirmed": approved by the brand owner. Only this may be released.
 */
export type ContentStatus = "placeholder" | "demo" | "confirmed";

export interface SiteConfig {
  readonly name: string;
  /** Canonical https origin without a trailing slash; feeds metadataBase and the sitemap. */
  readonly url: string;
  /** Mailbox behind the primary call to action. */
  readonly contactEmail: string;
  /** Public entry of the main product, or null while there is none to show. */
  readonly productUrl: string | null;
  readonly links: readonly SiteLink[];
  readonly contentStatus: ContentStatus;
}

export const site: SiteConfig = {
  name: "saberu",
  url: "https://saberu.com",
  contactEmail: "contact@saberu.com",
  productUrl: null,
  links: [],
  contentStatus: "demo",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLACEHOLDER_MAIL_DOMAIN = /@example\.(com|org|net)$/i;

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isHttpsOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === value;
  } catch {
    return false;
  }
}

/** Lists what prevents the site configuration from being published; empty means publishable. */
export function findSiteReleaseErrors(config: SiteConfig): string[] {
  const errors: string[] = [];
  if (config.contentStatus !== "confirmed") {
    errors.push(
      `content status is "${config.contentStatus}"; only content confirmed by the brand owner may be released`,
    );
  }
  if (config.name.trim() === "") {
    errors.push("site name is empty");
  }
  if (!isHttpsOrigin(config.url)) {
    errors.push(
      `site url "${config.url}" must be an https origin without path or trailing slash`,
    );
  }
  if (
    !EMAIL_PATTERN.test(config.contactEmail) ||
    PLACEHOLDER_MAIL_DOMAIN.test(config.contactEmail)
  ) {
    errors.push(
      `contact email "${config.contactEmail}" is missing or a placeholder`,
    );
  }
  if (config.productUrl !== null && !isHttpsUrl(config.productUrl)) {
    errors.push(`product url "${config.productUrl}" must be an https URL`);
  }
  config.links.forEach((link, index) => {
    if (link.label.trim() === "") {
      errors.push(`link #${index + 1} has an empty label`);
    }
    if (!isHttpsUrl(link.href)) {
      errors.push(`link "${link.label}" must point to an https URL`);
    }
  });
  return errors;
}
