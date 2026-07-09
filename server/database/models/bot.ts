export interface Chat {
  chat_id: number;
  name: string;
  warnings_before_ban: number;
  auto_delete_violations: boolean;
  rules: string[];
  silent_mode: boolean;
}

export interface Bot {
  id: string;
  name: string;
  chats: Chat[];
  token?: string;
  workspace_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBotRequest {
  id: string;
  name: string;
  chats: Chat[];
  token?: string; // Токен при создании
}

export interface UpdateBotRequest {
  name?: string;
  chats?: Chat[];
  token?: string; // Токен при обновлении
  is_active?: boolean;
}

// Интерфейс для API ответов (без токена)
export interface BotResponse {
  id: string;
  name: string;
  chats: Chat[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
