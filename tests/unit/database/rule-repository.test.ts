import { describe, expect, test } from "bun:test";
import { InMemoryRuleRepository } from "../../helpers/in-memory-rule-repository";
import { TEST_BOT_ID } from "../../helpers/constants";

describe("RuleRepository", () => {
  test("creates and finds rules with action fields and whitelist", async () => {
    const repo = new InMemoryRuleRepository();
    const created = await repo.create(TEST_BOT_ID, {
      id: "spam",
      name: "Spam",
      description: "No spam",
      ai_prompt: "detect spam",
      delete_on_violation: true,
      ban_on_violation: true,
      warnings_before_ban: 2,
      whitelist: ["100"],
    });

    expect(created.id).toBe("spam");
    expect(created.delete_on_violation).toBe(true);
    expect(created.whitelist).toEqual(["100"]);

    const found = await repo.findById("spam", TEST_BOT_ID);
    expect(found?.whitelist).toEqual(["100"]);

    const active = await repo.findActive(TEST_BOT_ID);
    expect(active).toHaveLength(1);
  });

  test("updates rule fields and whitelist", async () => {
    const repo = new InMemoryRuleRepository();
    await repo.create(TEST_BOT_ID, {
      id: "ads",
      name: "Ads",
      description: "No ads",
      ai_prompt: "detect ads",
    });

    const updated = await repo.update("ads", TEST_BOT_ID, {
      name: "Advertising",
      is_active: false,
      whitelist: ["@trusted"],
    });

    expect(updated?.name).toBe("Advertising");
    expect(updated?.is_active).toBe(false);
    expect(updated?.whitelist).toEqual(["@trusted"]);
  });

  test("deletes rule", async () => {
    const repo = new InMemoryRuleRepository();
    await repo.create(TEST_BOT_ID, {
      id: "temp",
      name: "Temp",
      description: "x",
      ai_prompt: "x",
    });

    expect(await repo.delete("temp", TEST_BOT_ID)).toBe(true);
    expect(await repo.findById("temp", TEST_BOT_ID)).toBeNull();
  });
});
