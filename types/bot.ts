export type BotMemberRole = "owner" | "manager";

export interface BotListItem {
  id: string;
  name: string;
  chats: Array<{ chat_id: number; name: string; rules: string[] }>;
  is_active: boolean;
  my_role?: BotMemberRole;
  created_at: string | Date;
  updated_at: string | Date;
}
