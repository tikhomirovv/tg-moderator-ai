import { describe, expect, test } from "bun:test";
import {
  DEFAULT_POST_LOGIN_PATH,
  normalizeAuthReturnTo,
  resolveReturnToPath,
  sanitizeReturnToPath,
} from "../../../lib/auth-return-to";

describe("auth returnTo", () => {
  test("sanitizeReturnToPath accepts in-app paths", () => {
    expect(sanitizeReturnToPath("/bots?add=join&code=ABC")).toBe(
      "/bots?add=join&code=ABC"
    );
  });

  test("sanitizeReturnToPath rejects open redirects", () => {
    expect(sanitizeReturnToPath("//evil.example")).toBeNull();
    expect(sanitizeReturnToPath("https://evil.example")).toBeNull();
    expect(sanitizeReturnToPath("/javascript:alert(1)")).toBeNull();
  });

  test("normalizeAuthReturnTo maps /join to bots join modal", () => {
    expect(normalizeAuthReturnTo("/join?code=TEAM42")).toBe(
      "/bots?add=join&code=TEAM42"
    );
    expect(normalizeAuthReturnTo("/join")).toBe("/bots?add=join");
  });

  test("resolveReturnToPath falls back to default", () => {
    expect(resolveReturnToPath(null)).toBe(DEFAULT_POST_LOGIN_PATH);
    expect(resolveReturnToPath("//bad")).toBe(DEFAULT_POST_LOGIN_PATH);
  });
});
