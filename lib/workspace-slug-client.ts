import { authClient } from "./auth-client";
import { reserveWorkspaceSlug } from "./workspace-slug";

async function isWorkspaceSlugAvailable(slug: string) {
  const { error } = await authClient.organization.checkSlug({ slug });
  return !error;
}

export async function reserveWorkspaceSlugForCreate(name: string) {
  return reserveWorkspaceSlug(name, isWorkspaceSlugAvailable);
}
