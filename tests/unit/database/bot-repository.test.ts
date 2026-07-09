import { describe, expect, test } from "bun:test";
import { BotRepository } from "../../../server/database/repositories/bot-repository";
import { RuleRepository } from "../../../server/database/repositories/rule-repository";
import { useTestDatabase } from "../../helpers/database";

describe("BotRepository", () => {
  useTestDatabase();

  test("creates bot with chats and per-chat rules", async () => {
    const ruleRepo = new RuleRepository();
    await ruleRepo.create({
      id: "spam",
      name: "Spam",
      description: "No spam",
      ai_prompt: "detect spam",
      severity: "medium",
    });
    await ruleRepo.create({
      id: "hate_speech",
      name: "Hate",
      description: "No hate",
      ai_prompt: "detect hate",
      severity: "high",
    });

    const botRepo = new BotRepository();
    const created = await botRepo.create({
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

    const publicBot = await botRepo.findById("mod-bot");
    expect(publicBot?.chats).toHaveLength(2);
    expect(publicBot).not.toHaveProperty("token");

    const privateBot = await botRepo.findByIdWithToken("mod-bot");
    expect(privateBot?.token).toBe("secret-token");
  });

  test("replaces chats on update", async () => {
    const botRepo = new BotRepository();
    await botRepo.create({
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

    const updated = await botRepo.update("replace-bot", {
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
});
