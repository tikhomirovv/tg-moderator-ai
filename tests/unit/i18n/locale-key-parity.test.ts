import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "../../..");
const en = JSON.parse(
  readFileSync(path.join(ROOT, "i18n/locales/en.json"), "utf8")
) as Record<string, unknown>;
const ru = JSON.parse(
  readFileSync(path.join(ROOT, "i18n/locales/ru.json"), "utf8")
) as Record<string, unknown>;

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") {
    return prefix ? [prefix] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      flattenKeys(item, prefix ? `${prefix}.${index}` : String(index))
    );
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (nested !== null && typeof nested === "object" && !Array.isArray(nested)) {
      return flattenKeys(nested, pathKey);
    }
    return [pathKey];
  });
}

describe("locale key parity", () => {
  test("ru.json has the same keys as en.json", () => {
    const enKeys = new Set(flattenKeys(en));
    const ruKeys = new Set(flattenKeys(ru));

    const missingInRu = [...enKeys].filter((key) => !ruKeys.has(key)).sort();
    const extraInRu = [...ruKeys].filter((key) => !enKeys.has(key)).sort();

    expect(missingInRu).toEqual([]);
    expect(extraInRu).toEqual([]);
  });
});
