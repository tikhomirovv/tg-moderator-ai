<template>
  <div />
</template>

<script setup lang="ts">
import { fetchAuthSession } from "~/lib/fetch-auth-session";
import { fetchUserWorkspaces } from "~/lib/fetch-workspaces";
import { resolveWorkspaceSlug } from "~/lib/workspace-resolve";
import { workspaceRoutes } from "~/lib/workspace-routes";

const session = await fetchAuthSession();

if (!session?.user) {
  await navigateTo("/login", { replace: true });
} else if (!session.user.emailVerified) {
  await navigateTo("/login?verify=required", { replace: true });
} else {
  const workspaces = await fetchUserWorkspaces();
  const targetSlug = resolveWorkspaceSlug(
    workspaces,
    session.session.activeOrganizationId
  );

  if (targetSlug) {
    await navigateTo(workspaceRoutes.home(targetSlug), { replace: true });
  }
}
</script>
