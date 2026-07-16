export interface LlmUsageRecord {
  id: number;
  bot_id: string;
  chat_id: number;
  message_id: number;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  estimated_cost_rub: number;
  success: boolean;
  created_at: Date;
}

export interface CreateLlmUsageInput {
  bot_id: string;
  chat_id: number;
  message_id: number;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  estimated_cost_rub: number;
  success: boolean;
}
