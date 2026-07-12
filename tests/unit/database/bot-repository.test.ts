import { describe, expect, test } from "bun:test";
import { InMemoryBotRepository } from "../../helpers/in-memory-bot-repository";
import { TEST_OWNER_USER_ID } from "../../helpers/constants";

describe("BotRepository", () => {
  test("creates bot with chats", async () => {
    const botRepo = new InMemoryBotRepository();
    const created = await botRepo.create(TEST_OWNER_USER_ID, {
      id: "mod-bot",
      name: "Moderator",
      token: "secret-token",
      chats: [
        {
          chat_id: -100111,
          name: "General",
          silent_mode: false,
        },
        {
          chat_id: -100222,
          name: "Strict",
          silent_mode: true,
        },
      ],
    });

    expect(created.chats).toHaveLength(2);
    expect(created.chats[0]?.rules_count).toBe(0);
    expect(created.chats[1]?.silent_mode).toBe(true);

    const publicBot = await botRepo.findById("mod-bot");
    expect(publicBot?.chats).toHaveLength(2);
    expect(publicBot).not.toHaveProperty("token");

    const privateBot = await botRepo.findByIdWithToken("mod-bot");
    expect(privateBot?.token).toBe("secret-token");
    expect(privateBot?.owner_user_id).toBe(TEST_OWNER_USER_ID);
  });

  test("replaces chats on update", async () => {
    const botRepo = new InMemoryBotRepository();
    await botRepo.create(TEST_OWNER_USER_ID, {
      id: "replace-bot",
      name: "Replace",
      chats: [
        {
          chat_id: -100333,
          name: "Old",
          silent_mode: false,
        },
      ],
    });

    const updated = await botRepo.update("replace-bot", {
      chats: [
        {
          chat_id: -100444,
          name: "New",
          silent_mode: true,
        },
      ],
    });

    expect(updated?.chats).toHaveLength(1);
    expect(updated?.chats[0]?.chat_id).toBe(-100444);
    expect(updated?.chats[0]?.silent_mode).toBe(true);
  });

  test("returns only bots accessible to user", async () => {
    const botRepo = new InMemoryBotRepository();
    await botRepo.create(TEST_OWNER_USER_ID, {
      id: "scoped-bot",
      name: "Scoped",
      chats: [],
    });

    const other = await botRepo.findAllForUser("other-user");
    expect(other).toHaveLength(0);

    const owner = await botRepo.findAllForUser(TEST_OWNER_USER_ID);
    expect(owner).toHaveLength(1);
    expect(owner[0]?.my_role).toBe("owner");
  });

  test("includes manager role for joined members", async () => {
    const botRepo = new InMemoryBotRepository();
    await botRepo.create(TEST_OWNER_USER_ID, {
      id: "shared-bot",
      name: "Shared",
      chats: [],
    });
    await botRepo.addMember("manager-user", "shared-bot", "manager");

    const managerBots = await botRepo.findAllForUser("manager-user");
    expect(managerBots).toHaveLength(1);
    expect(managerBots[0]?.my_role).toBe("manager");
  });
});
