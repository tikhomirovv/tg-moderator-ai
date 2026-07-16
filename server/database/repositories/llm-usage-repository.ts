import { getDatabaseConnection } from "../connection";
import { llmUsage } from "../schema";
import type { CreateLlmUsageInput, LlmUsageRecord } from "../models/llm-usage";

function toLlmUsage(row: typeof llmUsage.$inferSelect): LlmUsageRecord {
  return {
    id: row.id,
    bot_id: row.botId,
    chat_id: row.chatId,
    message_id: row.messageId,
    model: row.model,
    prompt_tokens: row.promptTokens,
    completion_tokens: row.completionTokens,
    estimated_cost_rub: row.estimatedCostRub,
    success: row.success,
    created_at: row.createdAt,
  };
}

export class LlmUsageRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async create(input: CreateLlmUsageInput): Promise<LlmUsageRecord> {
    const [row] = await this.db
      .insert(llmUsage)
      .values({
        botId: input.bot_id,
        chatId: input.chat_id,
        messageId: input.message_id,
        model: input.model,
        promptTokens: input.prompt_tokens,
        completionTokens: input.completion_tokens,
        estimatedCostRub: input.estimated_cost_rub,
        success: input.success,
      })
      .returning();

    return toLlmUsage(row);
  }
}
