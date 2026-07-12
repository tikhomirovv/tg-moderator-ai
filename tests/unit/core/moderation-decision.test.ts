import { describe, expect, test, mock } from "bun:test";
import {
  buildModerationDecisionRequest,
  saveModerationDecision,
} from "../../../server/core/moderation-decision";
import { InMemoryModerationDecisionRepository } from "../../helpers/in-memory-moderation-decision-repository";

describe("moderation decision save", () => {
  test("buildModerationDecisionRequest maps clean LLM response", () => {
    const payload = buildModerationDecisionRequest({
      botId: "bot-1",
      chatId: -100,
      userId: 42,
      messageId: 10,
      messageText: "hello",
      rulesApplied: ["spam", "ads"],
      timestamp: new Date("2026-07-12T10:00:00.000Z"),
      aiResponse: {
        violation_detected: false,
        confidence: 0.2,
        reasoning: "No violation",
      },
    });

    expect(payload.violation_detected).toBe(false);
    expect(payload.rules_applied).toEqual(["spam", "ads"]);
    expect(payload.rule_violated).toBeUndefined();
  });

  test("saveModerationDecision persists clean verdict without throwing", async () => {
    const repo = new InMemoryModerationDecisionRepository();
    const createSpy = mock(repo.create.bind(repo));

    await saveModerationDecision(
      buildModerationDecisionRequest({
        botId: "bot-1",
        chatId: -100,
        userId: 42,
        messageId: 11,
        messageText: "ok",
        rulesApplied: ["spam"],
        timestamp: new Date(),
        aiResponse: {
          violation_detected: false,
          confidence: 0.1,
          reasoning: "Fine",
        },
      }),
      { create: createSpy } as any
    );

    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  test("saveModerationDecision swallows repository errors", async () => {
    const failingRepo = {
      create: async () => {
        throw new Error("db down");
      },
    };

    await expect(
      saveModerationDecision(
        {
          bot_id: "bot-1",
          chat_id: -100,
          user_id: 1,
          message_id: 1,
          message_text: "x",
          violation_detected: true,
          ai_confidence: 0.9,
          ai_reasoning: "bad",
          rules_applied: ["spam"],
          timestamp: new Date(),
        },
        failingRepo as any
      )
    ).resolves.toBeUndefined();
  });
});
