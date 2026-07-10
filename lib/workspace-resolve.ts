import type { WorkspaceSummary } from "./fetch-workspaces";

export function findWorkspaceBySlug(
  workspaces: WorkspaceSummary[],
  slug: string
) {
  return workspaces.find((workspace) => workspace.slug === slug);
}

export function findWorkspaceById(
  workspaces: WorkspaceSummary[],
  workspaceId: string
) {
  return workspaces.find((workspace) => workspace.id === workspaceId);
}

export function resolveWorkspaceSlug(
  workspaces: WorkspaceSummary[],
  activeOrganizationId?: string | null
) {
  if (activeOrganizationId) {
    const active = findWorkspaceById(workspaces, activeOrganizationId);
    if (active) {
      return active.slug;
    }
  }

  return workspaces[0]?.slug;
}
