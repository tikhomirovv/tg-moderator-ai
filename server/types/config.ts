// Bot runtime configuration types (webhook path, not DB models).
export interface Chat {
  chat_id: number;
  name: string;
  rules: string[];
  /** When true, violations are logged in DB only — no Telegram delete/ban/warn. */
  silent_mode?: boolean;
}

export interface Bot {
  id: string;
  name: string;
  chats: Chat[];
}

export interface BotsConfig {
  bots: Bot[];
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  ai_prompt: string;
}

export interface RulesConfig {
  rules: Record<string, Rule>;
}

export interface BotToken {
  botId: string;
  token: string;
}
