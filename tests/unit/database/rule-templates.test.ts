import { describe, expect, test } from "bun:test";
import { applyTemplateToBot, RULE_TEMPLATES } from "../../../server/database/rule-templates";
import { InMemoryRuleRepository } from "../../helpers/in-memory-rule-repository";
import { TEST_BOT_ID } from "../../helpers/constants";

describe("applyTemplateToBot", () => {
  test("copies all rule templates to bot", async () => {
    const ruleRepo = new InMemoryRuleRepository();
    await applyTemplateToBot(TEST_BOT_ID, { ruleRepo });

    const rules = await ruleRepo.findAll(TEST_BOT_ID);
    expect(rules).toHaveLength(RULE_TEMPLATES.length);
    expect(rules.map((rule) => rule.name)).toEqual(
      RULE_TEMPLATES.map((template) => template.name)
    );
  });

  test("assigns different UUIDs per bot for the same preset names", async () => {
    const ruleRepo = new InMemoryRuleRepository();
    await applyTemplateToBot("bot-a", { ruleRepo });
    await applyTemplateToBot("bot-b", { ruleRepo });

    const rulesA = await ruleRepo.findAll("bot-a");
    const rulesB = await ruleRepo.findAll("bot-b");
    expect(rulesA[0]?.id).not.toBe(rulesB[0]?.id);
  });
});
