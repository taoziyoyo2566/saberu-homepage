import { expect, test } from "@playwright/test";

import { copy, languageLabel, preferenceCookieName, site } from "./fixtures";

test.use({ javaScriptEnabled: false });

test("content and language links work without JavaScript", async ({
  page,
  context,
}) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    copy.en.home.hero.title,
  );
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: copy.en.home.hero.primaryCta, exact: true })
      .first(),
  ).toHaveAttribute("href", `mailto:${site.contactEmail}`);

  await page
    .getByRole("link", { name: languageLabel("ja"), exact: true })
    .click();
  await expect(page).toHaveURL(/\/ja$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");

  // Recording the explicit preference needs JavaScript; this documents the limit.
  expect(
    (await context.cookies()).find(
      (entry) => entry.name === preferenceCookieName,
    ),
  ).toBeUndefined();
});

test("the 404 document is complete without JavaScript", async ({ page }) => {
  const response = await page.goto("/ja/missing");
  expect(response?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    copy.ja.notFound.title,
  );
  await page
    .getByRole("link", { name: copy.ja.notFound.backHome, exact: true })
    .click();
  await expect(page).toHaveURL(/\/ja$/);
});
