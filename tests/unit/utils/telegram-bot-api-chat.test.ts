import { describe, expect, test } from "bun:test";
import {
  telegramGetChat,
  telegramGetChatMember,
  telegramGetFile,
  buildTelegramFileUrl,
} from "../../../server/utils/telegram-bot-api";

describe("telegram-bot-api chat helpers", () => {
  test("telegramGetChat returns chat profile", async () => {
    const fetchFn = async (_url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      expect(body.chat_id).toBe(-1001);
      return new Response(
        JSON.stringify({
          ok: true,
          result: {
            id: -1001,
            type: "supergroup",
            title: "Test",
            username: "testchat",
          },
        })
      );
    };

    const chat = await telegramGetChat("token", -1001, fetchFn as typeof fetch);
    expect(chat.title).toBe("Test");
  });

  test("telegramGetChatMember returns member payload", async () => {
    const fetchFn = async () =>
      new Response(
        JSON.stringify({
          ok: true,
          result: {
            status: "administrator",
            user: { id: 1, is_bot: true, first_name: "Bot" },
            can_delete_messages: true,
            can_restrict_members: true,
          },
        })
      );

    const member = await telegramGetChatMember(
      "token",
      -1001,
      1,
      fetchFn as typeof fetch
    );
    expect(member.status).toBe("administrator");
  });

  test("telegramGetFile returns file path", async () => {
    const fetchFn = async () =>
      new Response(
        JSON.stringify({
          ok: true,
          result: {
            file_id: "abc",
            file_unique_id: "uniq",
            file_path: "photos/file.jpg",
          },
        })
      );

    const file = await telegramGetFile("token", "abc", fetchFn as typeof fetch);
    expect(file.file_path).toBe("photos/file.jpg");
    expect(buildTelegramFileUrl("token", file.file_path!)).toBe(
      "https://api.telegram.org/file/bottoken/photos/file.jpg"
    );
  });
});
