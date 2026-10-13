import { expect, test } from "@playwright/test";

import { hexToRgb, readThemeTokens } from "../support/design-tokens";

import { copy, languageLabel, localeIds } from "./fixtures";

/** Expected colours come from src/app/globals.css. */
const theme = readThemeTokens();

test("the language switcher is reachable and usable by keyboard", async ({
  page,
}) => {
  await page.goto("/en");
  const target = page.getByRole("link", {
    name: languageLabel("ja"),
    exact: true,
  });
  for (let step = 0; step < 20; step += 1) {
    await page.keyboard.press("Tab");
    if (
      await target.evaluate((element) => element === document.activeElement)
    ) {
      break;
    }
  }
  await expect(target).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/ja$/);
});

test("light theme by default", async ({ page }) => {
  await page.goto("/zh");
  expect(
    await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
  ).toBe(hexToRgb(theme.light.background));
});

test.describe("dark theme", () => {
  test.use({ colorScheme: "dark" });

  test("follows the system setting without a toggle", async ({ page }) => {
    await page.goto("/zh");
    expect(
      await page.evaluate(
        () => getComputedStyle(document.body).backgroundColor,
      ),
    ).toBe(hexToRgb(theme.dark.background));
  });
});

test("no horizontal overflow on a narrow phone in any language", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const locale of localeIds) {
    await page.goto(`/${locale}`);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow, locale).toBeLessThanOrEqual(0);
  }
});

test("unknown paths under a locale show that language's 404 with a real status", async ({
  page,
}) => {
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
