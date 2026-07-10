import { describe, expect, test } from "bun:test";
import { InMemoryBotRepository } from "../../helpers/in-memory-bot-repository";
import { InMemoryRuleRepository } from "../../helpers/in-memory-rule-repository";
import { TEST_WORKSPACE_ID } from "../../helpers/constants";

describe("BotRepository", () => {
  test("creates bot with chats and per-chat rules", async () => {
    const ruleRepo = new InMemoryRuleRepository();
    await ruleRepo.create(TEST_WORKSPACE_ID, {
      id: "spam",
      name: "Spam",
      description: "No spam",
      ai_prompt: "detect spam",
    });
    await ruleRepo.create(TEST_WORKSPACE_ID, {
      id: "hate_speech",
      name: "Hate",
      description: "No hate",
      ai_prompt: "detect hate",
    });

    const botRepo = new InMemoryBotRepository();
    const created = await botRepo.create(TEST_WORKSPACE_ID, {
      id: "mod-bot",
      name: "Moderator",
      token: "secret-token",
      chats: [
        {
          chat_id: -100111,
          name: "General",
          warnings_before_ban: 3,
          auto_delete_violations: true,
          silent_mode: false,
          rules: ["spam"],
        },
        {
          chat_id: -100222,
          name: "Strict",
          warnings_before_ban: 1,
          auto_delete_violations: false,
          silent_mode: true,
          rules: ["hate_speech"],
        },
      ],
    });

    expect(created.chats).toHaveLength(2);
    expect(created.chats[0]?.rules).toEqual(["spam"]);
    expect(created.chats[1]?.rules).toEqual(["hate_speech"]);

    const publicBot = await botRepo.findById("mod-bot", TEST_WORKSPACE_ID);
    expect(publicBot?.chats).toHaveLength(2);
    expect(publicBot).not.toHaveProperty("token");

    const privateBot = await botRepo.findByIdWithToken("mod-bot");
    expect(privateBot?.token).toBe("secret-token");
    expect(privateBot?.workspace_id).toBe(TEST_WORKSPACE_ID);
  });

  test("replaces chats on update", async () => {
    const botRepo = new InMemoryBotRepository();
    await botRepo.create(TEST_WORKSPACE_ID, {
      id: "replace-bot",
      name: "Replace",
      chats: [
        {
          chat_id: -100333,
          name: "Old",
          warnings_before_ban: 3,
          auto_delete_violations: true,
          silent_mode: false,
          rules: [],
        },
      ],
    });

    const updated = await botRepo.update("replace-bot", TEST_WORKSPACE_ID, {
      chats: [
        {
          chat_id: -100444,
          name: "New",
          warnings_before_ban: 2,
          auto_delete_violations: false,
          silent_mode: false,
          rules: [],
        },
      ],
    });

    expect(updated?.chats).toHaveLength(1);
    expect(updated?.chats[0]?.chat_id).toBe(-100444);
  });

  test("does not return bot from another workspace", async () => {
    const botRepo = new InMemoryBotRepository();
    await botRepo.create(TEST_WORKSPACE_ID, {
      id: "scoped-bot",
      name: "Scoped",
      chats: [],
    });

    const other = await botRepo.findById("scoped-bot", "other-workspace");
    expect(other).toBeNull();
  });
});
