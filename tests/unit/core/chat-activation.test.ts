import { describe, expect, test } from "bun:test";
import {
  activateChatForBot,
  evaluateAdministratorRights,
  evaluateChatHealth,
  isActivateCommandText,
  isChatActivationUpdate,
  resolveChatTitle,
} from "../../../server/core/chat-activation";
import type { ChatMemberAdministrator } from "../../../server/types/telegram";

const adminMember = (
  overrides: Partial<ChatMemberAdministrator> = {}
): ChatMemberAdministrator => ({
  status: "administrator",
  user: { id: 9001, is_bot: true, first_name: "ModBot" },
  can_be_edited: false,
  is_anonymous: false,
  can_manage_chat: true,
  can_delete_messages: true,
  can_manage_video_chats: true,
  can_restrict_members: true,
  can_promote_members: false,
  can_change_info: true,
  can_invite_users: true,
  ...overrides,
});

describe("evaluateAdministratorRights", () => {
  test("accepts required moderation rights", () => {
    expect(evaluateAdministratorRights(adminMember())).toEqual({ ok: true });
  });

  test("rejects missing delete/restrict rights", () => {
    const result = evaluateAdministratorRights(
      adminMember({
        can_delete_messages: false,
        can_restrict_members: false,
      })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("delete messages");
      expect(result.message).toContain("restrict members");
    }
  });
});

describe("activateChatForBot", () => {
  test("allows owner and completes pending", async () => {
    const completed: number[] = [];
    const upserted: Array<{ telegramChatId: number; name: string }> = [];

    const result = await activateChatForBot(
      {
        botId: "bot-1",
        botToken: "token",
        telegramChatId: -1001,
        activatedByTelegramId: 42,
        botAdminMember: adminMember(),
      },
      {
        getMemberRoleByTelegramId: async () => "owner",
        resolvePlatformUserId: async () => "user-owner",
        getChatMember: async (_token, _chatId, userId) => {
          if (userId === 42) {
            return {
              status: "member",
              user: { id: 42, is_bot: false, first_name: "Owner" },
            };
          }
          return adminMember();
        },
        getChat: async () => ({
          id: -1001,
          type: "supergroup",
          title: "Owners Club",
          photo: { big_file_id: "photo-big", small_file_id: "photo-small", small_file_unique_id: "a", big_file_unique_id: "b" },
        }),
        upsertActivatedChat: async (input) => {
          upserted.push({
            telegramChatId: input.telegramChatId,
            name: input.name,
          });
          return {
            id: 7,
            botId: "bot-1",
            chatId: input.telegramChatId,
            name: input.name,
            silentMode: false,
            photoFileId: input.photoFileId,
            telegramUsername: input.telegramUsername,
            healthStatus: input.healthStatus,
            healthMessage: input.healthMessage,
            healthCheckedAt: input.healthCheckedAt,
          };
        },
        completePendingForUser: async (_botId, _userId, chatRowId) => {
          completed.push(chatRowId);
        },
        failPendingForUser: async () => {},
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.chat.id).toBe(7);
      expect(result.chat.name).toBe("Owners Club");
    }
    expect(upserted).toEqual([{ telegramChatId: -1001, name: "Owners Club" }]);
    expect(completed).toEqual([7]);
  });

  test("allows manager and completes pending", async () => {
    const completed: number[] = [];

    const result = await activateChatForBot(
      {
        botId: "bot-1",
        botToken: "token",
        telegramChatId: -1001,
        activatedByTelegramId: 55,
        botAdminMember: adminMember(),
      },
      {
        getMemberRoleByTelegramId: async () => "manager",
        resolvePlatformUserId: async () => "user-manager",
        getChatMember: async () => ({
          status: "member",
          user: { id: 55, is_bot: false, first_name: "Mgr" },
        }),
        getChat: async () => ({
          id: -1001,
          type: "supergroup",
          title: "Team",
        }),
        upsertActivatedChat: async (input) => ({
          id: 9,
          botId: "bot-1",
          chatId: input.telegramChatId,
          name: input.name,
          silentMode: false,
          photoFileId: null,
          telegramUsername: null,
          healthStatus: input.healthStatus,
          healthMessage: input.healthMessage,
          healthCheckedAt: input.healthCheckedAt,
        }),
        completePendingForUser: async (_botId, _userId, chatRowId) => {
          completed.push(chatRowId);
        },
        failPendingForUser: async () => {},
      }
    );

    expect(result.ok).toBe(true);
    expect(completed).toEqual([9]);
  });

  test("reactivates an already registered chat via /activate", async () => {
    const result = await activateChatForBot(
      {
        botId: "bot-1",
        botToken: "token",
        telegramChatId: -1001,
        activatedByTelegramId: 42,
        botAdminMember: adminMember(),
      },
      {
        getMemberRoleByTelegramId: async () => "owner",
        resolvePlatformUserId: async () => "user-owner",
        getChatMember: async () => ({
          status: "member",
          user: { id: 42, is_bot: false, first_name: "Owner" },
        }),
        getChat: async () => ({
          id: -1001,
          type: "supergroup",
          title: "Renamed Club",
        }),
        upsertActivatedChat: async (input) => ({
          id: 7,
          botId: "bot-1",
          chatId: input.telegramChatId,
          name: input.name,
          silentMode: false,
          photoFileId: null,
          telegramUsername: null,
          healthStatus: input.healthStatus,
          healthMessage: input.healthMessage,
          healthCheckedAt: input.healthCheckedAt,
        }),
        completePendingForUser: async () => {},
        failPendingForUser: async () => {},
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.chat.name).toBe("Renamed Club");
    }
  });

  test("returns not_platform_member for unknown telegram user", async () => {
    const result = await activateChatForBot(
      {
        botId: "bot-1",
        botToken: "token",
        telegramChatId: -1001,
        activatedByTelegramId: 999,
        botAdminMember: adminMember(),
      },
      {
        getMemberRoleByTelegramId: async () => null,
        resolvePlatformUserId: async () => null,
        getChatMember: async () => ({
          status: "member",
          user: { id: 999, is_bot: false, first_name: "Stranger" },
        }),
        getChat: async () => ({
          id: -1001,
          type: "supergroup",
          title: "Club",
        }),
        upsertActivatedChat: async () => {
          throw new Error("should not upsert");
        },
        completePendingForUser: async () => {},
        failPendingForUser: async () => {},
      }
    );

    expect(result).toEqual({
      ok: false,
      code: "not_platform_member",
      message: "Only bot members on the platform can connect chats",
    });
  });

  test("rejects anonymous admin on /activate path", async () => {
    const failed: Array<{ code: string; message: string }> = [];

    const result = await activateChatForBot(
      {
        botId: "bot-1",
        botToken: "token",
        telegramChatId: -1001,
        activatedByTelegramId: 42,
        botAdminMember: adminMember(),
      },
      {
        getMemberRoleByTelegramId: async () => "owner",
        resolvePlatformUserId: async () => "user-owner",
        getChatMember: async () =>
          adminMember({
            user: { id: 42, is_bot: false, first_name: "Owner" },
            is_anonymous: true,
          }),
        getChat: async () => ({
          id: -1001,
          type: "supergroup",
          title: "Owners Club",
        }),
        upsertActivatedChat: async () => {
          throw new Error("should not upsert");
        },
        completePendingForUser: async () => {},
        failPendingForUser: async (_botId, _userId, code, message) => {
          failed.push({ code, message });
        },
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("anonymous_admin");
    }
    expect(failed).toHaveLength(1);
  });
});

describe("evaluateChatHealth", () => {
  test("marks non-admin bot as unhealthy", async () => {
    const health = await evaluateChatHealth("token", -1001, 9001, {
      getChatMember: async () => ({
        status: "member",
        user: { id: 9001, is_bot: true, first_name: "Bot" },
      }),
      getChat: async () => ({
        id: -1001,
        type: "supergroup",
        title: "Test",
      }),
    });

    expect(health.status).toBe("unhealthy");
    expect(health.message).toContain("not an administrator");
  });

  test("marks missing rights as degraded", async () => {
    const health = await evaluateChatHealth("token", -1001, 9001, {
      getChatMember: async () =>
        adminMember({ can_delete_messages: false }),
      getChat: async () => ({
        id: -1001,
        type: "supergroup",
        title: "Test",
      }),
    });

    expect(health.status).toBe("degraded");
  });
});

describe("resolveChatTitle", () => {
  test("prefers title then username", () => {
    expect(
      resolveChatTitle({ id: 1, type: "supergroup", title: "Main" })
    ).toBe("Main");
    expect(
      resolveChatTitle({ id: 1, type: "supergroup", username: "mainchat" })
    ).toBe("@mainchat");
  });
});

describe("isActivateCommandText", () => {
  test("matches /activate and bot mention variant", () => {
    expect(isActivateCommandText("/activate")).toBe(true);
    expect(isActivateCommandText("/activate@MyModBot")).toBe(true);
    expect(isActivateCommandText("/activate extra")).toBe(true);
    expect(isActivateCommandText("/start")).toBe(false);
  });
});

describe("isChatActivationUpdate", () => {
  test("detects my_chat_member and /activate messages", () => {
    expect(
      isChatActivationUpdate({
        update_id: 1,
        my_chat_member: {
          chat: { id: -1, type: "supergroup" },
          from: { id: 1, is_bot: false, first_name: "A" },
          date: 1,
          old_chat_member: {
            status: "member",
            user: { id: 2, is_bot: true, first_name: "B" },
          },
          new_chat_member: {
            status: "administrator",
            user: { id: 2, is_bot: true, first_name: "B" },
            can_be_edited: false,
            is_anonymous: false,
            can_manage_chat: true,
            can_delete_messages: true,
            can_manage_video_chats: true,
            can_restrict_members: true,
            can_promote_members: false,
            can_change_info: true,
            can_invite_users: true,
          },
        },
      })
    ).toBe(true);

    expect(
      isChatActivationUpdate({
        update_id: 2,
        message: {
          message_id: 1,
          date: 1,
          chat: { id: -1, type: "supergroup" },
          from: { id: 1, is_bot: false, first_name: "A" },
          text: "/activate",
        },
      })
    ).toBe(true);

    expect(
      isChatActivationUpdate({
        update_id: 3,
        message: {
          message_id: 2,
          date: 1,
          chat: { id: -1, type: "supergroup" },
          from: { id: 1, is_bot: false, first_name: "A" },
          text: "hello",
        },
      })
    ).toBe(false);
  });
});
