export interface UserMessage {
  _id?: string;
  bot_id: string;
  chat_id: number;
  user_id: number;
  message_id: number;
  text: string;
  timestamp: Date;
  is_deleted: boolean;
  deleted_at?: Date;
  deleted_reason?: string;
  created_at: Date;
}

export interface CreateUserMessageRequest {
  bot_id: string;
  chat_id: number;
  user_id: number;
  message_id: number;
  text: string;
  timestamp: Date;
}

export interface UpdateUserMessageRequest {
  is_deleted?: boolean;
  deleted_at?: Date;
  deleted_reason?: string;
}
