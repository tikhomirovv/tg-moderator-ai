import { describe, expect, test } from "bun:test";
import { InMemoryBotRepository } from "../../helpers/in-memory-bot-repository";
import { TEST_OWNER_USER_ID } from "../../helpers/constants";
import { validateBotMessageTemplate } from "../../../server/utils/bot-message-template-validation";

describe("bot message template API fields", () => {
  test("PUT persistence via repository update stores templates", async () => {
    const botRepo = new InMemoryBotRepository();
    await botRepo.create(TEST_OWNER_USER_ID, {
      id: "tpl-bot",
      name: "Template Bot",
      token: "secret",
    });

    const updated = await botRepo.update("tpl-bot", {
      warning_message_template: "Warn {rule_name}",
      ban_message_template: "Ban {rule_name}",
    });

    expect(updated?.warning_message_template).toBe("Warn {rule_name}");
    expect(updated?.ban_message_template).toBe("Ban {rule_name}");
  });

  test("validateBotMessageTemplate rejects overly long text", () => {
    expect(() =>
      validateBotMessageTemplate("x".repeat(5000), "warning_message_template")
    ).toThrow();
  });

  test("validateBotMessageTemplate allows null reset", () => {
    expect(validateBotMessageTemplate(null, "warning_message_template")).toBeNull();
  });
});
