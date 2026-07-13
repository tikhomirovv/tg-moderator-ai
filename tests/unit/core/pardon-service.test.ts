import { describe, expect, test } from "bun:test";
import {
  canModeratorPardon,
  pardonUserInChat,
} from "../../../server/core/pardon-service";
import type { UserContext } from "../../../server/database/models/user-context";

const baseUser = (): UserContext => ({
  bot_id: "bot-1",
  chat_id: -100,
  user_id: 42,
  warnings_count: 3,
  is_banned: true,
  last_activity: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
});

describe("pardon-service", () => {
  test("canModeratorPardon allows owner and manager", () => {
    expect(canModeratorPardon("owner")).toBe(true);
    expect(canModeratorPardon("manager")).toBe(true);
  });

  test("pardon resets warnings, unbans, and logs actions", async () => {
    const logged: string[] = [];
    let telegramUnbanCalled = false;

    const result = await pardonUserInChat(
      {
        botId: "bot-1",
        botToken: "token",
        telegramChatId: -100,
        userId: 42,
        operation: "pardon",
        moderatorUserId: "mod-user",
        moderatorRole: "manager",
      },
      {
        findUser: async () => baseUser(),
        resetWarnings: async () => ({ ...baseUser(), warnings_count: 0 }),
        clearBan: async () => ({
          ...baseUser(),
          warnings_count: 0,
          is_banned: false,
        }),
        unbanInTelegram: async () => {
          telegramUnbanCalled = true;
        },
        logAction: async (input) => {
          logged.push(input.action_type);
        },
      }
    );

    expect(result.ok).toBe(true);
    expect(telegramUnbanCalled).toBe(true);
    expect(logged).toEqual(["reset_warnings", "unban", "pardon"]);
  });

  test("reset_warnings only updates warn counter", async () => {
    const logged: string[] = [];

    const result = await pardonUserInChat(
      {
        botId: "bot-1",
        botToken: "token",
        telegramChatId: -100,
        userId: 42,
        operation: "reset_warnings",
        moderatorUserId: "owner-user",
        moderatorRole: "owner",
      },
      {
        findUser: async () => baseUser(),
        resetWarnings: async () => ({ ...baseUser(), warnings_count: 0 }),
        clearBan: async () => {
          throw new Error("should not clear ban");
        },
        unbanInTelegram: async () => {
          throw new Error("should not unban");
        },
        logAction: async (input) => {
          logged.push(input.action_type);
        },
      }
    );

    expect(result.ok).toBe(true);
    expect(logged).toEqual(["reset_warnings"]);
  });

  test("returns not found when user context is missing", async () => {
    const result = await pardonUserInChat(
      {
        botId: "bot-1",
        botToken: "token",
        telegramChatId: -100,
        userId: 99,
        operation: "unban",
        moderatorUserId: "owner-user",
        moderatorRole: "owner",
      },
      {
        findUser: async () => null,
        resetWarnings: async () => null,
        clearBan: async () => null,
        unbanInTelegram: async () => {},
        logAction: async () => {},
      }
    );

    expect(result).toEqual({
      ok: false,
      code: "user_not_found",
      message: "User not found in this chat",
    });
  });
});
