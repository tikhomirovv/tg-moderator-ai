import { fetchAuthSession } from "~/lib/fetch-auth-session";
import { fetchUserWorkspaces } from "~/lib/fetch-workspaces";
import {
  findWorkspaceBySlug,
  resolveWorkspaceSlug,
} from "~/lib/workspace-resolve";
import { replaceWorkspaceInPath, workspaceRoutes } from "~/lib/workspace-routes";
import { authClient } from "~/lib/auth-client";

export default defineNuxtRouteMiddleware(async (to) => {
  const workspaceSlug = to.params.slug;
  if (typeof workspaceSlug !== "string" || !workspaceSlug) {
    return;
  }

  const session = await fetchAuthSession();
  if (!session?.user) {
    return navigateTo("/login");
  }

  const workspaces = await fetchUserWorkspaces();
  const workspace = findWorkspaceBySlug(workspaces, workspaceSlug);

  if (!workspace) {
    const fallbackSlug = resolveWorkspaceSlug(
      workspaces,
      session.session.activeOrganizationId
    );
    if (fallbackSlug) {
      return navigateTo(replaceWorkspaceInPath(to.fullPath, fallbackSlug));
    }
    return navigateTo("/");
  }

  if (
    !import.meta.server &&
    session.session.activeOrganizationId !== workspace.id
  ) {
    await authClient.organization.setActive({
      organizationSlug: workspaceSlug,
    });
    await authClient.getSession();
  }
});
