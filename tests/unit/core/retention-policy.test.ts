import { describe, expect, test } from "bun:test";
import {
  MODERATION_RETENTION_DAYS,
  USER_MESSAGES_PER_SCOPE,
  moderationRetentionCutoff,
} from "../../../server/core/retention-policy";
import { MAX_USER_MESSAGES_PER_SCOPE } from "../../../server/core/chat-history";

describe("retention-policy", () => {
  test("exports hardcoded limits", () => {
    expect(USER_MESSAGES_PER_SCOPE).toBe(100);
    expect(MODERATION_RETENTION_DAYS).toBe(90);
    expect(MAX_USER_MESSAGES_PER_SCOPE).toBe(100);
  });

  test("moderationRetentionCutoff subtracts retention days in UTC", () => {
    const now = new Date("2026-07-12T12:00:00.000Z");
    const cutoff = moderationRetentionCutoff(now);
    expect(cutoff.toISOString()).toBe("2026-04-13T12:00:00.000Z");
  });
});
