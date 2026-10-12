import { expect, test, type Page } from "@playwright/test";

import {
  copy,
  languageLabel,
  preferenceCookieName as PREFERENCE,
} from "./fixtures";

test.describe("Japanese browser", () => {
  test.use({ locale: "ja-JP" });

  test("root follows the browser, an explicit choice overrides it and survives shared links", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/ja$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");

    await page.goto("/ja?ref=test#about");
    await page
      .getByRole("link", { name: languageLabel("zh"), exact: true })
      .click();
    await expect(page).toHaveURL(/\/zh\?ref=test#about$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hans");

    const cookie = (await context.cookies()).find(
      (entry) => entry.name === PREFERENCE,
    );
    expect(cookie).toMatchObject({
      value: "zh",
      path: "/",
      sameSite: "Lax",
      httpOnly: false,
    });
    expect(cookie?.expires).toBeGreaterThan(
      Date.now() / 1000 + 300 * 24 * 3600,
    );

    // A shared link shows its own language without touching the choice.
    await page.goto("/ja");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    expect(
      (await context.cookies()).find((entry) => entry.name === PREFERENCE)
        ?.value,
    ).toBe("zh");

    await page.goto("/");
    await expect(page).toHaveURL(/\/zh$/);
  });
});

/**
 * Follow a language link by keyboard. A mouse click would first scroll the
 * header link into view and destroy the position under test.
 */
async function activateWithoutScrolling(page: Page, name: string) {
  const link = page.getByRole("link", { name, exact: true });
  await link.evaluate((element: HTMLElement) =>
    element.focus({ preventScroll: true }),
  );
  await page.keyboard.press("Enter");
}

test("switching replaces the history entry and restores the section in the URL", async ({
  page,
}) => {
  // A real earlier entry: if the switch pushed instead of replacing, Back would
  // land on /en#services rather than on /zh.
  await page.goto("/zh");
  await page.goto("/en#services");
  // Move far away from the section so that only the restore can bring it back.
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await activateWithoutScrolling(page, languageLabel("ja"));
  await expect(page).toHaveURL(/\/ja#services$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");

  // The previous language stays in the DOM, hidden, so pick the visible copy.
  const services = page.getByRole("region", {
    name: copy.ja.home.services.heading,
  });
  const top = () =>
    services.evaluate((el) => Math.round(el.getBoundingClientRect().top));
  // Without the restore the section stays far above the viewport (negative).
  await expect.poll(top).toBeGreaterThanOrEqual(0);
  await expect.poll(top).toBeLessThan(120);

  await page.goBack();
  await expect(page).toHaveURL(/\/zh$/);
});

test("switching without a fragment keeps the scroll position", async ({
  page,
}) => {
  await page.goto("/en");
  await page.evaluate(() => window.scrollTo(0, 900));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(900);

  await activateWithoutScrolling(page, languageLabel("ja"));

  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page).toHaveURL(/\/ja$/);
  await expect
    .poll(() => page.evaluate(() => Math.round(window.scrollY)))
    .toBe(900);
});

test("the URL decides the language even when the cookie disagrees", async ({
  page,
  context,
  baseURL,
}) => {
  // Scoped to whatever instance is under test (E2E_BASE_URL), not a fixed host.
  await context.addCookies([
    { name: PREFERENCE, value: "zh", url: baseURL, sameSite: "Lax" },
  ]);
  const response = await page.goto("/en");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.goto("/");
  await expect(page).toHaveURL(/\/zh$/);
});
