<script setup lang="ts">
import { fetchAuthSession } from "~/lib/fetch-auth-session";
import { fetchUserWorkspaces } from "~/lib/fetch-workspaces";
import { findWorkspaceById } from "~/lib/workspace-resolve";
import { workspaceRoutes } from "~/lib/workspace-routes";

const route = useRoute();
const botId = route.params.id as string;
const session = await fetchAuthSession();
const activeId = session?.session?.activeOrganizationId;

if (activeId) {
  const workspaces = await fetchUserWorkspaces();
  const workspace = findWorkspaceById(workspaces, activeId);
  if (workspace) {
    await navigateTo(workspaceRoutes.bot(workspace.slug, botId), {
      replace: true,
    });
  } else {
    await navigateTo("/", { replace: true });
  }
} else {
  await navigateTo("/", { replace: true });
}
</script>
