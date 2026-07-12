export interface ModerationDecision {
  _id?: string;
  bot_id: string;
  chat_id: number;
  user_id: number;
  message_id: number;
  message_text: string;
  violation_detected: boolean;
  rule_violated?: string;
  ai_confidence: number;
  ai_reasoning: string;
  rules_applied: string[];
  timestamp: Date;
  created_at: Date;
}

export interface CreateModerationDecisionRequest {
  bot_id: string;
  chat_id: number;
  user_id: number;
  message_id: number;
  message_text: string;
  violation_detected: boolean;
  rule_violated?: string;
  ai_confidence: number;
  ai_reasoning: string;
  rules_applied: string[];
  timestamp: Date;
}
