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

  await requireSession(event);
});
