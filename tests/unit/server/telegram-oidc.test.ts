import { describe, expect, test } from "bun:test";
import {
  generateOidcState,
  generatePkcePair,
} from "../../../server/utils/telegram-oidc";

describe("telegram oidc helpers", () => {
  test("generatePkcePair creates verifier and S256 challenge", () => {
    const { verifier, challenge } = generatePkcePair();
    expect(verifier.length).toBeGreaterThan(20);
    expect(challenge).not.toBe(verifier);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test("generateOidcState returns unique hex values", () => {
    const a = generateOidcState();
    const b = generateOidcState();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[a-f0-9]{32}$/);
  });
});
