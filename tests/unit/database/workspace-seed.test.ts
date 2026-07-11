import { describe, expect, test } from "bun:test";
import { seedWorkspaceRules } from "../../../server/database/workspace-seed";
import { InMemoryRuleRepository } from "../../helpers/in-memory-rule-repository";
import { TEST_WORKSPACE_ID } from "../../helpers/constants";

describe("seedWorkspaceRules", () => {
  test("creates default rules once per workspace", async () => {
    const ruleRepo = new InMemoryRuleRepository();

    await seedWorkspaceRules(TEST_WORKSPACE_ID, { ruleRepo });
    await seedWorkspaceRules(TEST_WORKSPACE_ID, { ruleRepo });

    const rules = await ruleRepo.findAll(TEST_WORKSPACE_ID);

    expect(rules.length).toBe(4);
    expect(rules.map((rule) => rule.id).sort()).toEqual([
      "advertising",
      "gaming_violations",
      "hate_speech",
      "spam",
    ]);

    for (const rule of rules) {
      expect(rule.ai_prompt.toLowerCase()).not.toContain("определи");
      expect(rule.ai_prompt.toLowerCase()).not.toContain("прочитай");
      expect(rule.ai_prompt.toLowerCase()).not.toContain("проверь");
      expect(typeof rule.delete_on_violation).toBe("boolean");
      expect(typeof rule.ban_on_violation).toBe("boolean");
    }
  });

  test("creates the same library rule ids in different workspaces", async () => {
    const ruleRepo = new InMemoryRuleRepository();

    await seedWorkspaceRules("workspace-a", { ruleRepo });
    await seedWorkspaceRules("workspace-b", { ruleRepo });

    const rulesA = await ruleRepo.findAll("workspace-a");
    const rulesB = await ruleRepo.findAll("workspace-b");

    expect(rulesA.length).toBe(4);
    expect(rulesB.length).toBe(4);
    expect(rulesA.map((rule) => rule.id).sort()).toEqual(
      rulesB.map((rule) => rule.id).sort()
    );
  });
});
