import { describe, expect, test } from "bun:test";
import { RuleRepository } from "../../../server/database/repositories/rule-repository";
import { useTestDatabase } from "../../helpers/database";

describe("RuleRepository", () => {
  useTestDatabase();

  test("creates and finds rules", async () => {
    const repo = new RuleRepository();
    const created = await repo.create({
      id: "spam",
      name: "Spam",
      description: "No spam",
      ai_prompt: "detect spam",
      severity: "medium",
    });

    expect(created.id).toBe("spam");
    expect(created.is_active).toBe(true);

    const found = await repo.findById("spam");
    expect(found?.name).toBe("Spam");

    const active = await repo.findActive();
    expect(active).toHaveLength(1);
  });

  test("updates rule fields", async () => {
    const repo = new RuleRepository();
    await repo.create({
      id: "ads",
      name: "Ads",
      description: "No ads",
      ai_prompt: "detect ads",
      severity: "low",
    });

    const updated = await repo.update("ads", {
      name: "Advertising",
      is_active: false,
    });

    expect(updated?.name).toBe("Advertising");
    expect(updated?.is_active).toBe(false);
  });
});
