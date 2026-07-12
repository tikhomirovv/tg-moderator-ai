import { describe, expect, test } from "bun:test";
import { joinBotWithAccessCode } from "../../../server/core/bot-team-join";

describe("joinBotWithAccessCode", () => {
  test("rejects empty code", async () => {
    const result = await joinBotWithAccessCode("user-1", "   ", {
      findActiveByCode: async () => ({ botId: "bot-1" }),
      getMemberRole: async () => null,
      addMember: async () => {},
    });
    expect(result).toEqual({ ok: false, reason: "invalid_code" });
  });

  test("rejects unknown code", async () => {
    const result = await joinBotWithAccessCode("user-1", "NOPE", {
      findActiveByCode: async () => null,
      getMemberRole: async () => null,
      addMember: async () => {},
    });
    expect(result).toEqual({ ok: false, reason: "invalid_code" });
  });

  test("returns existing owner without adding member", async () => {
    let added = false;
    const result = await joinBotWithAccessCode("user-1", "CODE", {
      findActiveByCode: async () => ({ botId: "bot-1" }),
      getMemberRole: async () => "owner",
      addMember: async () => {
        added = true;
      },
    });
    expect(result).toEqual({
      ok: true,
      botId: "bot-1",
      alreadyOwner: true,
    });
    expect(added).toBe(false);
  });

  test("adds manager for valid code", async () => {
    const calls: Array<{ botId: string; userId: string; role: string }> = [];
    const result = await joinBotWithAccessCode("user-2", "CODE", {
      findActiveByCode: async () => ({ botId: "bot-1" }),
      getMemberRole: async () => null,
      addMember: async (botId, userId, role) => {
        calls.push({ botId, userId, role });
      },
    });
    expect(result).toEqual({
      ok: true,
      botId: "bot-1",
      alreadyOwner: false,
    });
    expect(calls).toEqual([
      { botId: "bot-1", userId: "user-2", role: "manager" },
    ]);
  });
});
