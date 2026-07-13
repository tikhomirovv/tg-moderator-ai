import { describe, expect, test } from "bun:test";
import { toBotResponse, toChat, toDateKey, toRule } from "../../../server/database/mappers";

describe("database mappers", () => {
  test("toRule maps drizzle row to API shape", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const rule = toRule({
      id: "spam",
      botId: "bot-1",
      chatId: 7,
      name: "Spam",
      description: "No spam",
      aiPrompt: "detect spam",
      isActive: true,
      deleteOnViolation: true,
      banOnViolation: false,
      warningsBeforeBan: 3,
      createdAt: now,
      updatedAt: now,
    });

    expect(rule).toEqual({
      id: "spam",
      chat_id: 7,
      name: "Spam",
      description: "No spam",
      ai_prompt: "detect spam",
      is_active: true,
      delete_on_violation: true,
      ban_on_violation: false,
      warnings_before_ban: 3,
      created_at: now,
      updated_at: now,
    });
  });

  test("toChat maps chat row with rules count", () => {
    const chat = toChat(
      {
        id: 1,
        botId: "bot-1",
        chatId: -100123,
        name: "Main",
        silentMode: false,
        photoFileId: "photo-big",
        telegramUsername: "mainchat",
        healthStatus: "ok",
        healthMessage: "Ready",
        healthCheckedAt: new Date("2026-07-01T00:00:00.000Z"),
      },
      3
    );

    expect(chat.id).toBe(1);
    expect(chat.rules_count).toBe(3);
    expect(chat.chat_id).toBe(-100123);
    expect(chat.silent_mode).toBe(false);
    expect(chat.photo_file_id).toBe("photo-big");
    expect(chat.health_status).toBe("ok");
  });

  test("toDateKey normalizes date to YYYY-MM-DD", () => {
    expect(toDateKey(new Date("2026-07-09T15:30:00.000Z"))).toBe("2026-07-09");
  });

  test("toBotResponse maps avatar metadata", () => {
    const now = new Date("2026-07-01T00:00:00.000Z");
    const bot = toBotResponse(
      {
        id: "mod_bot",
        ownerUserId: "user-1",
        name: "Mod Bot",
        token: "secret",
        webhookSecret: null,
        isActive: true,
        warningMessageTemplate: null,
        banMessageTemplate: null,
        photoFileId: "bot-photo",
        telegramBotId: 123456,
        createdAt: now,
        updatedAt: now,
      },
      []
    );

    expect(bot.photo_file_id).toBe("bot-photo");
    expect(bot.telegram_bot_id).toBe(123456);
  });
});
