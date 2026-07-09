import { authClient } from "~/lib/auth-client";

export default defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = ["/login", "/register"];

  if (publicPaths.some((path) => to.path.startsWith(path))) {
    return;
  }

  const { data: session } = await authClient.useSession(useFetch);

  if (!session.value) {
    return navigateTo("/login");
  }

  if (!session.value.user.emailVerified) {
    return navigateTo("/login?verify=required");
  }
});
