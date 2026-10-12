import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LanguageSwitcher } from "@/components/language-switcher";
import { locales, preferenceCookie } from "@/config/locales";

import ja from "../../messages/ja.json";

const replace = vi.fn();

// Keep the real module (redirect, notFound, …) and replace only the router hooks.
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({
    replace,
    push: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/ja",
  useParams: () => ({ locale: "ja" }),
}));

function renderSwitcher() {
  return render(
    <NextIntlClientProvider locale="ja" messages={ja}>
      <LanguageSwitcher />
    </NextIntlClientProvider>,
  );
}

function clearPreferenceCookie() {
  document.cookie = `${preferenceCookie.name}=; Max-Age=0; Path=/`;
}

describe("LanguageSwitcher", () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    window.history.replaceState(null, "", "/ja?ref=demo#about");
    replace.mockClear();
    scrollIntoView.mockClear();
    // jsdom implements neither method.
    Element.prototype.scrollIntoView = scrollIntoView;
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    clearPreferenceCookie();
  });

  afterEach(() => {
    // Drop the instance override so window.scrollY reads jsdom's own value again.
    Reflect.deleteProperty(window, "scrollY");
    vi.restoreAllMocks();
    clearPreferenceCookie();
    document.body.innerHTML = "";
  });

  it("renders a real link to the current page in every registered language", () => {
    renderSwitcher();
    expect(
      screen.getByRole("navigation", { name: ja.languageSwitcher.label }),
    ).toBeTruthy();
    for (const locale of locales) {
      const link = screen.getByRole("link", { name: locale.label });
      expect(link.getAttribute("href")).toBe(`/${locale.id}`);
      expect(link.getAttribute("hreflang")).toBe(locale.tag);
      expect(link.getAttribute("lang")).toBe(locale.tag);
      expect(link.getAttribute("aria-current")).toBe(
        locale.id === "ja" ? "true" : null,
      );
    }
  });

  it("records the choice, replaces the URL keeping query and hash, and restores the position", async () => {
    const section = document.createElement("section");
    section.id = "about";
    document.body.append(section);

    renderSwitcher();
    expect(scrollIntoView).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("link", { name: "简体中文" }));
    expect(document.cookie).toContain(`${preferenceCookie.name}=zh`);
    expect(replace).toHaveBeenCalledWith("/zh?ref=demo#about", {
      scroll: false,
    });

    // Changing the locale segment mounts the new tree (or reveals a preserved
    // one, which recreates its effects); its switcher restores the position once.
    cleanup();
    document.body.append(section);
    renderSwitcher();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(section);
  });

  it("restores the scroll position when the URL has no fragment", async () => {
    window.history.replaceState(null, "", "/ja?ref=demo");
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 640,
    });
    renderSwitcher();
    await userEvent.click(screen.getByRole("link", { name: "English" }));
    expect(replace).toHaveBeenCalledWith("/en?ref=demo", { scroll: false });

    cleanup();
    renderSwitcher();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 640);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("survives a fragment with a malformed escape", async () => {
    window.history.replaceState(null, "", "/ja#100%");
    renderSwitcher();
    await userEvent.click(screen.getByRole("link", { name: "English" }));
    expect(replace).toHaveBeenCalledWith("/en#100%", { scroll: false });

    cleanup();
    // Before the fix, decoding "%" threw inside the effect and took the page down.
    expect(() => renderSwitcher()).not.toThrow();
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it("leaves modified clicks to the browser and records nothing", () => {
    renderSwitcher();
    // Stand in for the browser: note whether the page cancelled the default
    // action, then stop jsdom from attempting the navigation itself.
    const cancelledByPage: boolean[] = [];
    const standIn = (event: Event) => {
      cancelledByPage.push(event.defaultPrevented);
      event.preventDefault();
    };
    document.addEventListener("click", standIn);
    const link = screen.getByRole("link", { name: "English" });
    for (const modifier of [
      { ctrlKey: true },
      { metaKey: true },
      { shiftKey: true },
      { altKey: true },
    ]) {
      fireEvent.click(link, modifier);
    }
    document.removeEventListener("click", standIn);
    expect(cancelledByPage).toEqual([false, false, false, false]);
    expect(replace).not.toHaveBeenCalled();
    expect(document.cookie).not.toContain(preferenceCookie.name);
  });
});
