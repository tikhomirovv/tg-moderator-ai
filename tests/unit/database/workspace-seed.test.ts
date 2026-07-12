import { describe, expect, test } from "bun:test";
import { seedWorkspaceRules } from "../../../server/database/workspace-seed";
import { InMemoryRuleRepository } from "../../helpers/in-memory-rule-repository";
import { TEST_WORKSPACE_ID } from "../../helpers/constants";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EXPECTED_RULE_NAMES = [
  "Спам и реклама",
  "Ненавистнические высказывания",
  "Реклама",
  "Нарушения в игровых чатах",
];

describe("seedWorkspaceRules", () => {
  test("creates default rules once per workspace with UUID ids", async () => {
    const ruleRepo = new InMemoryRuleRepository();

    await seedWorkspaceRules(TEST_WORKSPACE_ID, { ruleRepo });
    await seedWorkspaceRules(TEST_WORKSPACE_ID, { ruleRepo });

    const rules = await ruleRepo.findAll(TEST_WORKSPACE_ID);

    expect(rules.length).toBe(4);
    expect(rules.map((rule) => rule.name).sort()).toEqual(
      [...EXPECTED_RULE_NAMES].sort()
    );

    for (const rule of rules) {
      expect(rule.id).toMatch(UUID_PATTERN);
      expect(rule.ai_prompt.toLowerCase()).not.toContain("определи");
      expect(rule.ai_prompt.toLowerCase()).not.toContain("прочитай");
      expect(rule.ai_prompt.toLowerCase()).not.toContain("проверь");
      expect(typeof rule.delete_on_violation).toBe("boolean");
      expect(typeof rule.ban_on_violation).toBe("boolean");
    }
  });

  test("assigns different UUIDs per workspace for the same preset names", async () => {
    const ruleRepo = new InMemoryRuleRepository();

    await seedWorkspaceRules("workspace-a", { ruleRepo });
    await seedWorkspaceRules("workspace-b", { ruleRepo });

    const rulesA = await ruleRepo.findAll("workspace-a");
    const rulesB = await ruleRepo.findAll("workspace-b");

    expect(rulesA.map((rule) => rule.name).sort()).toEqual(
      rulesB.map((rule) => rule.name).sort()
    );
    expect(rulesA.map((rule) => rule.id).sort()).not.toEqual(
      rulesB.map((rule) => rule.id).sort()
    );
  });
});
