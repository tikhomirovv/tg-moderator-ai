// Типы для Telegram API
export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  text?: string;
  date: number;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
}

export interface TelegramChatPhoto {
  small_file_id: string;
  small_file_unique_id: string;
  big_file_id: string;
  big_file_unique_id: string;
}

export interface TelegramChatFull extends TelegramChat {
  photo?: TelegramChatPhoto;
}

export interface ChatMemberMember {
  status: "member";
  user: TelegramUser;
}

export interface ChatMemberLeft {
  status: "left";
  user: TelegramUser;
}

export interface ChatMemberBanned {
  status: "kicked";
  user: TelegramUser;
  until_date?: number;
}

export interface ChatMemberAdministrator {
  status: "administrator";
  user: TelegramUser;
  can_be_edited: boolean;
  is_anonymous: boolean;
  can_manage_chat: boolean;
  can_delete_messages: boolean;
  can_manage_video_chats: boolean;
  can_restrict_members: boolean;
  can_promote_members: boolean;
  can_change_info: boolean;
  can_invite_users: boolean;
  can_post_stories?: boolean;
  can_edit_stories?: boolean;
  can_delete_stories?: boolean;
  can_post_messages?: boolean;
  can_edit_messages?: boolean;
  can_pin_messages?: boolean;
  can_manage_topics?: boolean;
}

export type ChatMember =
  | ChatMemberMember
  | ChatMemberLeft
  | ChatMemberBanned
  | ChatMemberAdministrator
  | { status: string; user: TelegramUser };

export interface ChatMemberUpdated {
  chat: TelegramChat;
  from: TelegramUser;
  date: number;
  old_chat_member: ChatMember;
  new_chat_member: ChatMember;
}

export interface TelegramBot {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
  my_chat_member?: ChatMemberUpdated;
}
