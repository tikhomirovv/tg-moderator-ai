import { createAuthClient } from "better-auth/vue";
import { organizationClient } from "better-auth/client/plugins";
import type { Auth } from "./auth";

function getBaseUrl() {
  if (import.meta.client) {
    return window.location.origin;
  }
  return process.env.BETTER_AUTH_URL || "http://localhost:3001";
}

export const authClient = createAuthClient<Auth>({
  baseURL: getBaseUrl(),
  plugins: [organizationClient()],
});

export type AuthClient = typeof authClient;
