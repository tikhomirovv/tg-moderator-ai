import { describe, expect, test } from "bun:test";
import {
  enrichWithRuleName,
  loadRuleNameMap,
  resolveRuleName,
} from "../../../server/core/rule-name-lookup";
import { InMemoryRuleRepository } from "../../helpers/in-memory-rule-repository";
import { TEST_WORKSPACE_ID } from "../../helpers/constants";

describe("rule-name-lookup", () => {
  test("loadRuleNameMap resolves ids to names", async () => {
    const ruleRepo = new InMemoryRuleRepository();
    const spam = await ruleRepo.create(TEST_WORKSPACE_ID, {
      name: "Spam",
      description: "No spam",
      ai_prompt: "spam",
    });

    const names = await loadRuleNameMap(
      TEST_WORKSPACE_ID,
      [spam.id, "missing-id"],
      { ruleRepo }
    );

    expect(names.get(spam.id)).toBe("Spam");
    expect(resolveRuleName("missing-id", names)).toBeNull();
  });

  test("enrichWithRuleName adds rule_name without dropping rule_violated", () => {
    const enriched = enrichWithRuleName(
      { rule_violated: "rule-1", action_type: "warning" as const },
      new Map([["rule-1", "Spam"]])
    );

    expect(enriched.rule_violated).toBe("rule-1");
    expect(enriched.rule_name).toBe("Spam");
  });
});
