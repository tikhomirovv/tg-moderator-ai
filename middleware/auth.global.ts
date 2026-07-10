import { fetchAuthSession } from "~/lib/fetch-auth-session";

export default defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/accept-invitation",
  ];

  if (publicPaths.some((path) => to.path.startsWith(path))) {
    return;
  }

  const session = await fetchAuthSession();

  if (!session?.user) {
    return navigateTo("/login");
  }

  if (!session.user.emailVerified) {
    return navigateTo("/login?verify=required");
  }
});
