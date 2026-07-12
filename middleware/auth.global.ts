import { fetchSession } from "~/lib/fetch-session";
import { normalizeAuthReturnTo } from "~/lib/auth-return-to";

export default defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = ["/login"];

  if (publicPaths.some((path) => to.path.startsWith(path))) {
    return;
  }

  const session = await fetchSession();

  if (!session?.user) {
    const returnTo = normalizeAuthReturnTo(to.fullPath);
    return navigateTo({
      path: "/login",
      query: { returnTo },
    });
  }
});
