export interface AppUser {
  id: string;
  telegram_id: number;
  username?: string | null;
  name: string;
  photo_url?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SessionUser {
  id: string;
  telegram_id: number;
  username?: string | null;
  name: string;
  photo_url?: string | null;
}
