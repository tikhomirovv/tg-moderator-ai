import { describe, expect, test } from "bun:test";
import {
  TelegramBotApiError,
  telegramGetMe,
} from "../../../server/utils/telegram-bot-api";

describe("telegram-bot-api", () => {
  test("telegramGetMe returns bot profile on success", async () => {
    const fetchFn = async () =>
      new Response(
        JSON.stringify({
          ok: true,
          result: {
            id: 123,
            is_bot: true,
            first_name: "Mod Bot",
            username: "Mod_Bot",
            can_join_groups: true,
            can_read_all_group_messages: false,
            supports_inline_queries: false,
          },
        })
      );

    const me = await telegramGetMe("token", fetchFn as typeof fetch);
    expect(me.username).toBe("Mod_Bot");
    expect(me.first_name).toBe("Mod Bot");
  });

  test("telegramGetMe rejects invalid token", async () => {
    const fetchFn = async () =>
      new Response(
        JSON.stringify({
          ok: false,
          description: "Unauthorized",
        })
      );

    await expect(telegramGetMe("bad-token", fetchFn as typeof fetch)).rejects.toMatchObject({
      name: "TelegramBotApiError",
      code: "invalid_token",
    } satisfies Partial<TelegramBotApiError>);
  });
});
