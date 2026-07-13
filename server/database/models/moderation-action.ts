export type ModerationActionType =
  | "warning"
  | "delete"
  | "ban"
  | "reset_warnings"
  | "unban"
  | "pardon";

export interface ModerationAction {
  _id?: string;
  bot_id: string;
  chat_id: number;
  user_id: number;
  message_id: number;
  action_type: ModerationActionType;
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
  action_type: ModerationActionType;
  rule_violated?: string;
  ai_confidence: number;
  ai_reasoning: string;
  timestamp: Date;
  moderator_bot_id: string;
}
