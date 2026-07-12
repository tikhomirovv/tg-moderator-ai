import { describe, expect, test } from "bun:test";
import {
  applyRuleTemplateToBot,
  listRuleTemplatesForBot,
  RULE_TEMPLATES,
} from "../../../server/database/rule-templates";
import { InMemoryRuleRepository } from "../../helpers/in-memory-rule-repository";
import { TEST_BOT_ID } from "../../helpers/constants";

describe("rule templates", () => {
  test("listRuleTemplatesForBot marks added templates", async () => {
    const ruleRepo = new InMemoryRuleRepository();
    await applyRuleTemplateToBot(TEST_BOT_ID, "commercial-ads", { ruleRepo });

    const catalog = await listRuleTemplatesForBot(TEST_BOT_ID, { ruleRepo });
    expect(catalog).toHaveLength(RULE_TEMPLATES.length);
    expect(catalog.find((item) => item.id === "commercial-ads")?.added).toBe(
      true
    );
    expect(catalog.find((item) => item.id === "politics")?.added).toBe(false);
  });

  test("applyRuleTemplateToBot adds a single preset", async () => {
    const ruleRepo = new InMemoryRuleRepository();
    const result = await applyRuleTemplateToBot(TEST_BOT_ID, "commercial-ads", {
      ruleRepo,
    });

    expect(result.added).toBe(true);
    if (!result.added) {
      throw new Error("expected template to be added");
    }

    const rules = await ruleRepo.findAll(TEST_BOT_ID);
    expect(rules).toHaveLength(1);
    expect(rules[0]?.name).toBe("Коммерческая реклама");
  });

  test("applyRuleTemplateToBot is idempotent per template name", async () => {
    const ruleRepo = new InMemoryRuleRepository();
    const first = await applyRuleTemplateToBot(TEST_BOT_ID, "commercial-ads", {
      ruleRepo,
    });
    const second = await applyRuleTemplateToBot(TEST_BOT_ID, "commercial-ads", {
      ruleRepo,
    });

    expect(first.added).toBe(true);
    expect(second).toEqual({ added: false, reason: "already_exists" });

    const rules = await ruleRepo.findAll(TEST_BOT_ID);
    expect(rules).toHaveLength(1);
  });

  test("assigns different UUIDs per bot for the same preset", async () => {
    const ruleRepo = new InMemoryRuleRepository();
    await applyRuleTemplateToBot("bot-a", "commercial-ads", { ruleRepo });
    await applyRuleTemplateToBot("bot-b", "commercial-ads", { ruleRepo });

    const rulesA = await ruleRepo.findAll("bot-a");
    const rulesB = await ruleRepo.findAll("bot-b");
    expect(rulesA[0]?.id).not.toBe(rulesB[0]?.id);
  });
});
