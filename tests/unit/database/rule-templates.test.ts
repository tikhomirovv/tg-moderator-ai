import { describe, expect, test } from "bun:test";
import {
  applyRuleTemplateToChat,
  listRuleTemplatesForChat,
  RULE_TEMPLATES,
} from "../../../server/database/rule-templates";
import { InMemoryRuleRepository } from "../../helpers/in-memory-rule-repository";
import {
  TEST_BOT_ID,
  TEST_CHAT_INTERNAL_ID,
} from "../../helpers/constants";

describe("rule templates", () => {
  test("listRuleTemplatesForChat marks added templates", async () => {
    const ruleRepo = new InMemoryRuleRepository();
    await applyRuleTemplateToChat(TEST_BOT_ID, TEST_CHAT_INTERNAL_ID, "commercial-ads", {
      ruleRepo,
    });

    const catalog = await listRuleTemplatesForChat(
      TEST_BOT_ID,
      TEST_CHAT_INTERNAL_ID,
      { ruleRepo }
    );
    expect(catalog).toHaveLength(RULE_TEMPLATES.length);
    expect(catalog.find((item) => item.id === "commercial-ads")?.added).toBe(
      true
    );
    expect(catalog.find((item) => item.id === "politics")?.added).toBe(false);
  });

  test("applyRuleTemplateToChat adds a single preset", async () => {
    const ruleRepo = new InMemoryRuleRepository();
    const result = await applyRuleTemplateToChat(
      TEST_BOT_ID,
      TEST_CHAT_INTERNAL_ID,
      "commercial-ads",
      {
        ruleRepo,
      }
    );

    expect(result.added).toBe(true);
    if (!result.added) {
      throw new Error("expected template to be added");
    }

    const rules = await ruleRepo.findAllByChat(TEST_BOT_ID, TEST_CHAT_INTERNAL_ID);
    expect(rules).toHaveLength(1);
    expect(rules[0]?.name).toBe("Коммерческая реклама");
  });

  test("applyRuleTemplateToChat is idempotent per template name", async () => {
    const ruleRepo = new InMemoryRuleRepository();
    const first = await applyRuleTemplateToChat(
      TEST_BOT_ID,
      TEST_CHAT_INTERNAL_ID,
      "commercial-ads",
      {
        ruleRepo,
      }
    );
    const second = await applyRuleTemplateToChat(
      TEST_BOT_ID,
      TEST_CHAT_INTERNAL_ID,
      "commercial-ads",
      {
        ruleRepo,
      }
    );

    expect(first.added).toBe(true);
    expect(second).toEqual({ added: false, reason: "already_exists" });

    const rules = await ruleRepo.findAllByChat(TEST_BOT_ID, TEST_CHAT_INTERNAL_ID);
    expect(rules).toHaveLength(1);
  });

  test("assigns different UUIDs per chat for the same preset", async () => {
    const ruleRepo = new InMemoryRuleRepository();
    await applyRuleTemplateToChat(TEST_BOT_ID, 1, "commercial-ads", { ruleRepo });
    await applyRuleTemplateToChat(TEST_BOT_ID, 2, "commercial-ads", { ruleRepo });

    const rulesA = await ruleRepo.findAllByChat(TEST_BOT_ID, 1);
    const rulesB = await ruleRepo.findAllByChat(TEST_BOT_ID, 2);
    expect(rulesA[0]?.id).not.toBe(rulesB[0]?.id);
  });
});
