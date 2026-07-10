import { authClient } from "./auth-client";

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
};

export async function fetchUserWorkspaces(): Promise<WorkspaceSummary[]> {
  if (import.meta.server) {
    const headers = useRequestHeaders(["cookie"]);
    const data = await $fetch<WorkspaceSummary[]>("/api/auth/organization/list", {
      headers,
    });
    return data ?? [];
  }

  const { data } = await authClient.organization.list();
  return data ?? [];
}
