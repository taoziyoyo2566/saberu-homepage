import { readFileSync } from "node:fs";

import {
  parse,
  TYPE,
  type MessageFormatElement,
} from "@formatjs/icu-messageformat-parser";
import { describe, expect, it } from "vitest";

import { localeIds } from "@/config/locales";

type Leaves = Map<string, string>;

function loadMessages(locale: string): unknown {
  const url = new URL(`../../messages/${locale}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as unknown;
}

function flatten(value: unknown, prefix: string, into: Leaves): Leaves {
  if (typeof value === "string") {
    into.set(prefix, value);
    return into;
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`"${prefix}" must be a string or an object of messages`);
  }
  for (const [key, child] of Object.entries(value)) {
    flatten(child, prefix === "" ? key : `${prefix}.${key}`, into);
  }
  return into;
}

function collectArguments(
  elements: readonly MessageFormatElement[],
  into: Set<string>,
): Set<string> {
  for (const element of elements) {
    switch (element.type) {
      case TYPE.argument:
      case TYPE.number:
      case TYPE.date:
      case TYPE.time:
        into.add(element.value);
        break;
      case TYPE.plural:
      case TYPE.select:
        into.add(element.value);
        for (const option of Object.values(element.options)) {
          collectArguments(option.value, into);
        }
        break;
      case TYPE.tag:
        // Rich-text tags are rendered by the components, so every language
        // must use the same ones.
        into.add(`<${element.value}>`);
        collectArguments(element.children, into);
        break;
      default:
        break;
    }
  }
  return into;
}

const messages = new Map(
  localeIds.map((locale) => [
    locale,
    flatten(loadMessages(locale), "", new Map()),
  ]),
);
const reference = messages.get("en");
if (!reference) {
  throw new Error("English messages are the reference and must exist");
}

describe("messages", () => {
  it("exist for every registered locale with identical keys", () => {
    for (const [locale, leaves] of messages) {
      expect([...leaves.keys()].sort(), locale).toEqual(
        [...reference.keys()].sort(),
      );
    }
  });

  it("have no empty strings", () => {
    for (const [locale, leaves] of messages) {
      for (const [key, text] of leaves) {
        expect(text.trim(), `${locale}:${key}`).not.toBe("");
      }
    }
  });

  it("are valid ICU messages with the same arguments and tags in every language", () => {
    for (const [key, referenceText] of reference) {
      const expected = [
        ...collectArguments(parse(referenceText), new Set()),
      ].sort();
      for (const [locale, leaves] of messages) {
        const text = leaves.get(key) ?? "";
        const actual = [...collectArguments(parse(text), new Set())].sort();
        expect(actual, `${locale}:${key}`).toEqual(expected);
      }
    }
  });
});
