import { ObjectId } from "mongodb";

export interface Chat {
  chat_id: number;
  name: string;
  rules: string[];
  warnings_before_ban: number;
  auto_delete_violations: boolean;
}

export interface Bot {
  _id?: ObjectId;
  id: string; // Уникальный идентификатор бота
  name: string;
  chats: Chat[];
  token?: string; // Токен бота (опционально, может быть скрыт)
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
  _id?: ObjectId;
  id: string;
  name: string;
  chats: Chat[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
