export interface ModerationAction {
  _id?: string;
  bot_id: string;
  chat_id: number;
  user_id: number;
  message_id: number;
  action_type: "warning" | "delete" | "ban";
  rule_violated?: string;
  ai_confidence: number;
  ai_reasoning: string;
  timestamp: Date;
  moderator_bot_id: string;
  created_at: Date;
}

export interface CreateModerationActionRequest {
  bot_id: string;
  chat_id: number;
  user_id: number;
  message_id: number;
  action_type: "warning" | "delete" | "ban";
  rule_violated?: string;
  ai_confidence: number;
  ai_reasoning: string;
  timestamp: Date;
  moderator_bot_id: string;
}
