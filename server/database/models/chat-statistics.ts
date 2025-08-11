export interface ChatStatistics {
  _id?: string;
  bot_id: string;
  chat_id: number;
  date: Date; // YYYY-MM-DD
  messages_processed: number;
  warnings_issued: number;
  messages_deleted: number;
  users_banned: number;
  unique_users: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateChatStatisticsRequest {
  bot_id: string;
  chat_id: number;
  date: Date;
  messages_processed?: number;
  warnings_issued?: number;
  messages_deleted?: number;
  users_banned?: number;
  unique_users?: number;
}

export interface UpdateChatStatisticsRequest {
  messages_processed?: number;
  warnings_issued?: number;
  messages_deleted?: number;
  users_banned?: number;
  unique_users?: number;
}
