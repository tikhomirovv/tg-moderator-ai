export type ChatHealthStatus = "ok" | "degraded" | "unhealthy";

export interface Chat {
  id: number;
  chat_id: number;
  name: string;
  silent_mode: boolean;
  rules_count: number;
  photo_file_id?: string | null;
  telegram_username?: string | null;
  health_status?: ChatHealthStatus | null;
  health_message?: string | null;
  health_checked_at?: Date | null;
}

export interface Bot {
  id: string;
  name: string;
  chats: Chat[];
  token?: string;
  owner_user_id: string;
  is_active: boolean;
  webhook_secret?: string | null;
  photo_file_id?: string | null;
  telegram_bot_id?: number | null;
  warning_message_template?: string | null;
  ban_message_template?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBotRequest {
  token: string;
}

/** Resolved bot identity after Telegram getMe — used by repository create. */
export interface CreateBotInput {
  id: string;
  name: string;
  token: string;
  photo_file_id?: string | null;
  telegram_bot_id?: number | null;
  chats?: Array<{
    chat_id: number;
    name: string;
    silent_mode?: boolean;
  }>;
}

export interface UpdateBotRequest {
  name?: string;
  chats?: Array<{
    chat_id: number;
    name: string;
    silent_mode?: boolean;
  }>;
  token?: string;
  is_active?: boolean;
  warning_message_template?: string | null;
  ban_message_template?: string | null;
}

export type BotMemberRole = "owner" | "manager";

export interface BotResponse {
  id: string;
  name: string;
  chats: Chat[];
  is_active: boolean;
  my_role?: BotMemberRole;
  my_user_id?: string;
  photo_file_id?: string | null;
  telegram_bot_id?: number | null;
  warning_message_template?: string | null;
  ban_message_template?: string | null;
  delivery_status?: "healthy" | "disabled" | "degraded" | "unavailable";
  delivery_message?: string;
  created_at: Date;
  updated_at: Date;
}
