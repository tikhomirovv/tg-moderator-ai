import { describe, expect, test } from "bun:test";
import { seedWorkspaceRules } from "../../../server/database/workspace-seed";
import { RuleRepository } from "../../../server/database/repositories/rule-repository";
import {
  TEST_WORKSPACE_ID,
  useTestDatabase,
} from "../../helpers/database";
import { getDatabaseConnection } from "../../../server/database/connection";
import { organization } from "../../../server/database/auth-schema";

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

  test("creates the same library rule ids in different workspaces", async () => {
    const db = getDatabaseConnection().getDb();
    const now = new Date();

    await db.insert(organization).values([
      {
        id: "workspace-a",
        name: "Workspace A",
        slug: "workspace-a",
        createdAt: now,
      },
      {
        id: "workspace-b",
        name: "Workspace B",
        slug: "workspace-b",
        createdAt: now,
      },
    ]);

    await seedWorkspaceRules("workspace-a");
    await seedWorkspaceRules("workspace-b");

    const repo = new RuleRepository();
    const rulesA = await repo.findAll("workspace-a");
    const rulesB = await repo.findAll("workspace-b");

    expect(rulesA.length).toBe(4);
    expect(rulesB.length).toBe(4);
    expect(rulesA.map((rule) => rule.id).sort()).toEqual(
      rulesB.map((rule) => rule.id).sort()
    );
  });
});
