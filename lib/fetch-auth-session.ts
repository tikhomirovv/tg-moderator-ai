import type { Session } from "better-auth";
import { authClient } from "./auth-client";

type AuthSession = Session | null;

export async function fetchAuthSession(): Promise<AuthSession> {
  if (import.meta.server) {
    const headers = useRequestHeaders(["cookie"]);
    return await $fetch<AuthSession>("/api/auth/get-session", { headers });
  }

  const { data } = await authClient.getSession();
  return data ?? null;
}
