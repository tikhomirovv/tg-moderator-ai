import { describe, expect, test } from "bun:test";
import {
  chatNameKey,
  loadChatNameMap,
  resolveChatName,
} from "../../../server/core/chat-name-lookup";

describe("chat-name-lookup", () => {
  test("builds composite lookup keys", () => {
    expect(chatNameKey("mybot", -100)).toBe("mybot:-100");
  });

  test("loads chat names grouped by bot", async () => {
    const chatRepo = {
      async findNamesByTelegramChatIds(botId: string, telegramChatIds: number[]) {
        if (botId === "bot-a") {
          return telegramChatIds
            .filter((id) => id === 1)
            .map((id) => ({ chatId: id, name: "Alpha chat" }));
        }
        return [];
      },
    };

    const names = await loadChatNameMap(
      [
        { botId: "bot-a", chatId: 1 },
        { botId: "bot-a", chatId: 2 },
        { botId: "bot-b", chatId: 3 },
      ],
      { chatRepo }
    );

    expect(resolveChatName("bot-a", 1, names)).toBe("Alpha chat");
    expect(resolveChatName("bot-a", 2, names)).toBeNull();
    expect(resolveChatName("bot-b", 3, names)).toBeNull();
  });
});
