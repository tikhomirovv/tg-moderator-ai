import { requireSession } from "../utils/session";

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

  if (path === "/api/health") {
    return;
  }

  const { user } = await requireSession(event);
  event.context.authUser = user;
});
