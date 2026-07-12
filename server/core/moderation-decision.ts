import { logger } from "./logger";
import { AIModerationResponse } from "../types/moderation";
import { CreateModerationDecisionRequest } from "../database/models/moderation-decision";
import { ModerationDecisionRepository } from "../database/repositories/moderation-decision-repository";

export function buildModerationDecisionRequest(input: {
  botId: string;
  chatId: number;
  userId: number;
  messageId: number;
  messageText: string;
  rulesApplied: string[];
  timestamp: Date;
  aiResponse: AIModerationResponse;
}): CreateModerationDecisionRequest {
  return {
    bot_id: input.botId,
    chat_id: input.chatId,
    user_id: input.userId,
    message_id: input.messageId,
    message_text: input.messageText,
    violation_detected: input.aiResponse.violation_detected,
    rule_violated: input.aiResponse.rule_violated,
    ai_confidence: input.aiResponse.confidence,
    ai_reasoning: input.aiResponse.reasoning,
    rules_applied: input.rulesApplied,
    timestamp: input.timestamp,
  };
}

/** Persist LLM verdict; failures must not break moderation flow. */
export async function saveModerationDecision(
  data: CreateModerationDecisionRequest,
  repo: ModerationDecisionRepository = new ModerationDecisionRepository()
): Promise<void> {
  try {
    await repo.create(data);
  } catch (error) {
    logger.error(
      { error: error as Error, botId: data.bot_id, messageId: data.message_id },
      "Failed to save moderation decision"
    );
  }
}
