import { afterEach, describe, expect, test } from "bun:test";
import {
  buildVerificationUrl,
  buildInvitationAcceptUrl,
  getAuthBaseUrl,
  getEmailVerificationCallbackUrl,
  getPasswordResetRedirectUrl,
} from "../../../lib/auth";
import { AUTH_OK_PATH } from "../../../lib/auth-constants";

const originalEnv = {
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  NUXT_PUBLIC_SITE_URL: process.env.NUXT_PUBLIC_SITE_URL,
};

afterEach(() => {
  if (originalEnv.BETTER_AUTH_URL === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalEnv.BETTER_AUTH_URL;
  }

  if (originalEnv.NUXT_PUBLIC_SITE_URL === undefined) {
    delete process.env.NUXT_PUBLIC_SITE_URL;
  } else {
    process.env.NUXT_PUBLIC_SITE_URL = originalEnv.NUXT_PUBLIC_SITE_URL;
  }
});

describe("auth URL helpers", () => {
  test("builds absolute verification callback URL", () => {
    process.env.BETTER_AUTH_URL = "https://app.example.com/";

    expect(getEmailVerificationCallbackUrl()).toBe(
      "https://app.example.com/login?verified=1"
    );
  });

  test("buildVerificationUrl uses absolute callback URL", () => {
    process.env.BETTER_AUTH_URL = "https://app.example.com";

    const url = buildVerificationUrl("test-token");
    expect(url).toContain("https://app.example.com/api/auth/verify-email");
    expect(url).toContain(
      encodeURIComponent("https://app.example.com/login?verified=1")
    );
  });

  test("getAuthBaseUrl falls back to localhost in dev", () => {
    delete process.env.BETTER_AUTH_URL;
    delete process.env.NUXT_PUBLIC_SITE_URL;

    expect(getAuthBaseUrl()).toBe("http://localhost:3001");
  });

  test("AUTH_OK_PATH points to Better Auth built-in health route", () => {
    expect(AUTH_OK_PATH).toBe("/api/auth/ok");
  });

  test("buildInvitationAcceptUrl is absolute", () => {
    process.env.BETTER_AUTH_URL = "https://app.example.com";
    expect(buildInvitationAcceptUrl("inv-123")).toBe(
      "https://app.example.com/accept-invitation/inv-123"
    );
  });

  test("getPasswordResetRedirectUrl is absolute", () => {
    process.env.BETTER_AUTH_URL = "https://app.example.com";
    expect(getPasswordResetRedirectUrl()).toBe(
      "https://app.example.com/reset-password"
    );
  });
});
