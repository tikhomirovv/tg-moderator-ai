import type { H3Event } from "h3";

export function getWorkspaceId(event: H3Event): string {
  const workspaceId = event.context.workspaceId as string | undefined;
  if (!workspaceId) {
    throw createError({
      statusCode: 403,
      statusMessage: "No active workspace",
    });
  }
  return workspaceId;
}
