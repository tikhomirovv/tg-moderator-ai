export interface Chat {
  chat_id: number;
  name: string;
  rules: string[];
  silent_mode: boolean;
}

export interface Bot {
  id: string;
  name: string;
  chats: Chat[];
  token?: string;
  owner_user_id: string;
  is_active: boolean;
  webhook_secret?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBotRequest {
  id: string;
  name: string;
  chats: Chat[];
  token?: string;
}

export interface UpdateBotRequest {
  name?: string;
  chats?: Chat[];
  token?: string;
  is_active?: boolean;
}

export type BotMemberRole = "owner" | "manager";

export interface BotResponse {
  id: string;
  name: string;
  chats: Chat[];
  is_active: boolean;
  my_role?: BotMemberRole;
  delivery_status?: "healthy" | "disabled" | "degraded" | "unavailable";
  delivery_message?: string;
  created_at: Date;
  updated_at: Date;
}
