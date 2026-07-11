import { describe, expect, test } from "bun:test";
import { shouldRedirectFromBotDetail } from "../../../lib/workspace-bot-route";

describe("workspace-bot-route", () => {
  test("redirects when bot is missing after workspace switch", () => {
    expect(shouldRedirectFromBotDetail(false)).toBe(true);
  });

  test("stays on bot detail when bot exists in workspace", () => {
    expect(shouldRedirectFromBotDetail(true)).toBe(false);
  });
});
