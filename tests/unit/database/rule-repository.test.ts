import { describe, expect, test } from "bun:test";
import { InMemoryRuleRepository } from "../../helpers/in-memory-rule-repository";
import { TEST_WORKSPACE_ID } from "../../helpers/constants";

describe("RuleRepository", () => {
  test("creates and finds rules with action fields and whitelist", async () => {
    const repo = new InMemoryRuleRepository();
    const created = await repo.create(TEST_WORKSPACE_ID, {
      id: "spam",
      name: "Spam",
      description: "No spam",
      ai_prompt: "detect spam",
      delete_on_violation: true,
      ban_on_violation: true,
      warnings_before_ban: 2,
      whitelist: [{ telegram_user_id: 100, username: null }],
    });

    expect(created.id).toBe("spam");
    expect(created.delete_on_violation).toBe(true);
    expect(created.whitelist).toHaveLength(1);

    const found = await repo.findById("spam", TEST_WORKSPACE_ID);
    expect(found?.whitelist[0]?.telegram_user_id).toBe(100);

    const active = await repo.findActive(TEST_WORKSPACE_ID);
    expect(active).toHaveLength(1);
  });

  test("updates rule fields and whitelist", async () => {
    const repo = new InMemoryRuleRepository();
    await repo.create(TEST_WORKSPACE_ID, {
      id: "ads",
      name: "Ads",
      description: "No ads",
      ai_prompt: "detect ads",
    });

    const updated = await repo.update("ads", TEST_WORKSPACE_ID, {
      name: "Advertising",
      is_active: false,
      whitelist: [{ telegram_user_id: null, username: "trusted" }],
    });

    expect(updated?.name).toBe("Advertising");
    expect(updated?.is_active).toBe(false);
    expect(updated?.whitelist[0]?.username).toBe("trusted");
  });

  test("deletes rule", async () => {
    const repo = new InMemoryRuleRepository();
    await repo.create(TEST_WORKSPACE_ID, {
      id: "temp",
      name: "Temp",
      description: "x",
      ai_prompt: "x",
    });

    expect(await repo.delete("temp", TEST_WORKSPACE_ID)).toBe(true);
    expect(await repo.findById("temp", TEST_WORKSPACE_ID)).toBeNull();
  });
});
