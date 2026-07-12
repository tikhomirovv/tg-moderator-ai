import { describe, expect, test } from "bun:test";
import { InMemoryModerationDecisionRepository } from "../../helpers/in-memory-moderation-decision-repository";

describe("moderation retention deleteOlderThan", () => {
  test("removes rows older than cutoff", async () => {
    const repo = new InMemoryModerationDecisionRepository();
    const oldDate = new Date("2026-01-01T00:00:00.000Z");
    const freshDate = new Date("2026-07-01T00:00:00.000Z");

    await repo.create({
      bot_id: "bot",
      chat_id: -100,
      user_id: 1,
      message_id: 1,
      message_text: "old",
      violation_detected: false,
      ai_confidence: 0.1,
      ai_reasoning: "old",
      rules_applied: ["spam"],
      timestamp: oldDate,
    });
    const fresh = await repo.create({
      bot_id: "bot",
      chat_id: -100,
      user_id: 1,
      message_id: 2,
      message_text: "fresh",
      violation_detected: false,
      ai_confidence: 0.1,
      ai_reasoning: "fresh",
      rules_applied: ["spam"],
      timestamp: freshDate,
    });

    const cutoff = new Date("2026-06-01T00:00:00.000Z");
    const deleted = await repo.deleteOlderThan(cutoff);
    expect(deleted).toBe(1);

    const page = await repo.listByBot("bot", { page: 1, limit: 10 });
    expect(page.total).toBe(1);
    expect(page.items[0]?.message_text).toBe("fresh");
  });
});
