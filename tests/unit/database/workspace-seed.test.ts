import { describe, expect, test } from "bun:test";
import { seedWorkspaceRules } from "../../../server/database/workspace-seed";
import { RuleRepository } from "../../../server/database/repositories/rule-repository";
import { TEST_WORKSPACE_ID, useTestDatabase } from "../../helpers/database";

describe("seedWorkspaceRules", () => {
  useTestDatabase();

  test("creates default rules once per workspace", async () => {
    await seedWorkspaceRules(TEST_WORKSPACE_ID);
    await seedWorkspaceRules(TEST_WORKSPACE_ID);

    const repo = new RuleRepository();
    const rules = await repo.findAll(TEST_WORKSPACE_ID);

    expect(rules.length).toBe(4);
    expect(rules.map((r) => r.id).sort()).toEqual([
      "advertising",
      "gaming_violations",
      "hate_speech",
      "spam",
    ]);
  });
});
