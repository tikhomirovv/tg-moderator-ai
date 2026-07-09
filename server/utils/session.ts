import type { H3Event } from "h3";
import { getAuth } from "../../lib/auth";

export async function requireWorkspaceSession(event: H3Event) {
  const session = await getAuth().api.getSession({
    headers: event.headers,
  });

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!session.user.emailVerified) {
    throw createError({
      statusCode: 403,
      statusMessage: "Email not verified",
    });
  }

  const workspaceId = session.session.activeOrganizationId;
  if (!workspaceId) {
    throw createError({
      statusCode: 403,
      statusMessage: "No active workspace",
    });
  }

  return {
    session,
    workspaceId,
    user: session.user,
  };
}

export async function getOptionalSession(event: H3Event) {
  return getAuth().api.getSession({
    headers: event.headers,
  });
}
