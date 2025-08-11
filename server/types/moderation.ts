// Типы для модерации
export interface Warning {
  id: string;
  timestamp: Date;
  rule_violated: string;
  message_id: number;
  ai_confidence: number;
  ai_reasoning: string;
}

export interface UserState {
  user_id: number;
  chat_id: number;
  warnings: Warning[];
  is_banned: boolean;
  ban_expires_at?: Date;
  total_violations: number;
}

export interface ModerationLog {
  timestamp: Date;
  bot_id: string;
  chat_id: number;
  user_id: number;
  message_id: number;
  action: "warning" | "ban" | "delete" | "ignore";
  rule_violated: string;
  ai_confidence: number;
  ai_reasoning: string;
  moderator_override?: boolean;
}

export interface AIModerationRequest {
  message: string;
  user_id: number;
  chat_id: number;
  rules: string[];
  context: {
    user_warnings: number;
    chat_history: string[];
  };
}

export interface AIModerationResponse {
  violation_detected: boolean;
  rule_violated?: string;
  confidence: number;
  reasoning: string;
}
