// Типы для конфигурации ботов
export interface Chat {
  chat_id: number;
  name: string;
  rules: string[];
  warnings_before_ban: number;
  auto_delete_violations: boolean;
}

export interface Bot {
  id: string;
  name: string;
  chats: Chat[];
}

export interface BotsConfig {
  bots: Bot[];
}

// Типы для правил модерации
export interface Rule {
  name: string;
  description: string;
  ai_prompt: string;
  severity: "low" | "medium" | "high";
}

export interface RulesConfig {
  rules: Record<string, Rule>;
}

// Типы для токенов
export interface BotToken {
  botId: string;
  token: string;
}
