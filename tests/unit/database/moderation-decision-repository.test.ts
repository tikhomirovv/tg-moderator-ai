import { describe, expect, test } from "bun:test";
import { InMemoryModerationDecisionRepository } from "../../helpers/in-memory-moderation-decision-repository";

describe("ModerationDecisionRepository", () => {
  test("creates and lists decisions by bot with pagination", async () => {
    const repo = new InMemoryModerationDecisionRepository();

    for (let i = 1; i <= 3; i++) {
      await repo.create({
        bot_id: "audit-bot",
        chat_id: -100,
        user_id: 42,
        message_id: i,
        message_text: `message ${i}`,
        violation_detected: i % 2 === 1,
        rule_violated: i % 2 === 1 ? "spam" : undefined,
        ai_confidence: 0.8,
        ai_reasoning: `reason ${i}`,
        rules_applied: ["spam"],
        timestamp: new Date(`2026-07-1${i}T10:00:00.000Z`),
      });
    }

    const page1 = await repo.listByBot("audit-bot", { page: 1, limit: 2 });
    expect(page1.total).toBe(3);
    expect(page1.items).toHaveLength(2);
    expect(page1.items[0]?.message_id).toBe(3);

    const page2 = await repo.listByBot("audit-bot", { page: 2, limit: 2 });
    expect(page2.items).toHaveLength(1);
    expect(page2.items[0]?.message_id).toBe(1);
  });

  test("stores clean LLM verdicts", async () => {
    const repo = new InMemoryModerationDecisionRepository();

    const created = await repo.create({
      bot_id: "audit-bot",
      chat_id: -100,
      user_id: 7,
      message_id: 99,
      message_text: "hello",
      violation_detected: false,
      ai_confidence: 0.12,
      ai_reasoning: "Allowed greeting",
      rules_applied: ["spam"],
      timestamp: new Date(),
    });

    expect(created.violation_detected).toBe(false);
    expect(created.rule_violated).toBeUndefined();
  });
});
