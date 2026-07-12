export interface SessionUser {
  id: string;
  telegram_id: number;
  username?: string | null;
  name: string;
  photo_url?: string | null;
}

export interface AppSession {
  user: SessionUser | null;
}

export async function fetchSession(): Promise<AppSession | null> {
  if (import.meta.server) {
    const headers = useRequestHeaders(["cookie"]);
    return await $fetch<AppSession>("/api/auth/session", { headers });
  }

  return await $fetch<AppSession>("/api/auth/session");
}
