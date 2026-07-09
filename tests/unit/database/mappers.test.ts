import { describe, expect, test } from "bun:test";
import { toChat, toDateKey, toRule } from "../../../server/database/mappers";

describe("database mappers", () => {
  test("toRule maps drizzle row to API shape", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const rule = toRule({
      id: "spam",
      name: "Spam",
      description: "No spam",
      aiPrompt: "detect spam",
      severity: "medium",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    expect(rule).toEqual({
      id: "spam",
      name: "Spam",
      description: "No spam",
      ai_prompt: "detect spam",
      severity: "medium",
      is_active: true,
      created_at: now,
      updated_at: now,
    });
  });

  test("toChat maps chat row with rule ids", () => {
    const chat = toChat(
      {
        id: 1,
        botId: "bot-1",
        chatId: -100123,
        name: "Main",
        warningsBeforeBan: 2,
        autoDeleteViolations: true,
        silentMode: false,
      },
      ["spam", "hate_speech"]
    );

    expect(chat.rules).toEqual(["spam", "hate_speech"]);
    expect(chat.chat_id).toBe(-100123);
  });

  test("toDateKey normalizes date to YYYY-MM-DD", () => {
    expect(toDateKey(new Date("2026-07-09T15:30:00.000Z"))).toBe("2026-07-09");
  });
});
