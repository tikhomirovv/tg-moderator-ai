export interface UserContext {
  _id?: string;
  bot_id: string;
  chat_id: number;
  user_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  warnings_count: number;
  is_banned: boolean;
  banned_at?: Date;
  banned_by?: string; // rule_id
  last_activity: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserContextRequest {
  bot_id: string;
  chat_id: number;
  user_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface UpdateUserContextRequest {
  warnings_count?: number;
  is_banned?: boolean;
  banned_at?: Date;
  banned_by?: string;
  last_activity?: Date;
  username?: string;
  first_name?: string;
  last_name?: string;
}
