import { requireWorkspaceSession } from "../utils/session";

export default defineEventHandler(async (event) => {
  const path = event.path;

  if (!path.startsWith("/api/")) {
    return;
  }

  if (path.startsWith("/api/auth")) {
    return;
  }

  if (path.startsWith("/api/telegram/webhook")) {
    return;
  }

  const { workspaceId, session, user } = await requireWorkspaceSession(event);
  event.context.workspaceId = workspaceId;
  event.context.authSession = session;
  event.context.authUser = user;
});
