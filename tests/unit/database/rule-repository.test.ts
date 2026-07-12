import { describe, expect, test } from "bun:test";
import { InMemoryRuleRepository } from "../../helpers/in-memory-rule-repository";
import {
  TEST_BOT_ID,
  TEST_CHAT_INTERNAL_ID,
} from "../../helpers/constants";

describe("RuleRepository", () => {
  test("creates and finds chat-scoped rules with action fields", async () => {
    const repo = new InMemoryRuleRepository();
    const created = await repo.create(TEST_BOT_ID, TEST_CHAT_INTERNAL_ID, {
      id: "spam",
      name: "Spam",
      description: "No spam",
      ai_prompt: "detect spam",
      delete_on_violation: true,
      ban_on_violation: true,
      warnings_before_ban: 2,
    });

    expect(created.id).toBe("spam");
    expect(created.chat_id).toBe(TEST_CHAT_INTERNAL_ID);
    expect(created.delete_on_violation).toBe(true);

    const found = await repo.findById("spam", TEST_BOT_ID, TEST_CHAT_INTERNAL_ID);
    expect(found?.name).toBe("Spam");

    const active = await repo.findActiveForChat(
      TEST_BOT_ID,
      TEST_CHAT_INTERNAL_ID
    );
    expect(active).toHaveLength(1);
  });

  test("cannot read rules from another chat", async () => {
    const repo = new InMemoryRuleRepository();
    await repo.create(TEST_BOT_ID, TEST_CHAT_INTERNAL_ID, {
      id: "spam",
      name: "Spam",
      description: "No spam",
      ai_prompt: "detect spam",
    });

    const otherChatRules = await repo.findAllByChat(TEST_BOT_ID, 99);
    expect(otherChatRules).toHaveLength(0);

    const missing = await repo.findById("spam", TEST_BOT_ID, 99);
    expect(missing).toBeNull();
  });

  test("updates rule fields", async () => {
    const repo = new InMemoryRuleRepository();
    await repo.create(TEST_BOT_ID, TEST_CHAT_INTERNAL_ID, {
      id: "ads",
      name: "Ads",
      description: "No ads",
      ai_prompt: "detect ads",
    });

    const updated = await repo.update("ads", TEST_BOT_ID, TEST_CHAT_INTERNAL_ID, {
      name: "Advertising",
      is_active: false,
    });

    expect(updated?.name).toBe("Advertising");
    expect(updated?.is_active).toBe(false);
  });

  test("deletes rule", async () => {
    const repo = new InMemoryRuleRepository();
    await repo.create(TEST_BOT_ID, TEST_CHAT_INTERNAL_ID, {
      id: "temp",
      name: "Temp",
      description: "x",
      ai_prompt: "x",
    });

    expect(
      await repo.delete("temp", TEST_BOT_ID, TEST_CHAT_INTERNAL_ID)
    ).toBe(true);
    expect(
      await repo.findById("temp", TEST_BOT_ID, TEST_CHAT_INTERNAL_ID)
    ).toBeNull();
  });
});
