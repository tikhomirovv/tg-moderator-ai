import { fetchSession } from "~/lib/fetch-session";

export default defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = ["/login", "/join"];

  if (publicPaths.some((path) => to.path.startsWith(path))) {
    return;
  }

  const session = await fetchSession();

  if (!session?.user) {
    return navigateTo("/login");
  }
});
