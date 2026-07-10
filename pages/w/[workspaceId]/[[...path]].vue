<template>
  <div />
</template>

<script setup lang="ts">
import { fetchUserWorkspaces } from "~/lib/fetch-workspaces";
import { findWorkspaceById } from "~/lib/workspace-resolve";
import { workspacePath } from "~/lib/workspace-routes";

const route = useRoute();
const workspaceId = route.params.workspaceId as string;
const pathSegments = route.params.path;
const suffix = pathSegments
  ? `/${Array.isArray(pathSegments) ? pathSegments.join("/") : pathSegments}`
  : "";

const workspaces = await fetchUserWorkspaces();
const workspace = findWorkspaceById(workspaces, workspaceId);

if (workspace) {
  await navigateTo(`${workspacePath(workspace.slug)}${suffix}`, {
    replace: true,
  });
} else {
  await navigateTo("/", { replace: true });
}
</script>
