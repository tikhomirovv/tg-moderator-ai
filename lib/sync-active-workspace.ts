import { authClient } from "./auth-client";
import { fetchUserWorkspaces } from "./fetch-workspaces";
import { findWorkspaceBySlug } from "./workspace-resolve";

export async function syncActiveWorkspaceSlug(workspaceSlug: string) {
  if (import.meta.server) {
    return;
  }

  const workspaces = await fetchUserWorkspaces();
  const workspace = findWorkspaceBySlug(workspaces, workspaceSlug);
  if (!workspace) {
    return;
  }

  const { data: session } = await authClient.getSession();
  if (session?.session.activeOrganizationId === workspace.id) {
    return;
  }

  await authClient.organization.setActive({
    organizationSlug: workspaceSlug,
  });
  await authClient.getSession();
}
