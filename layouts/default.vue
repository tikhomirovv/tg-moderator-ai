<template>
  <div class="min-h-screen flex bg-gray-100">
    <aside
      class="w-64 bg-white border-r border-gray-200 hidden md:flex md:flex-col"
    >
      <div class="h-16 flex items-center px-4 border-b">
        <span class="text-lg font-semibold">TG Moderator</span>
      </div>

      <div v-if="routes" class="p-4 border-b">
        <WorkspaceSwitcher
          ref="workspaceSwitcher"
          :current-workspace-slug="routes.slug"
          @create-workspace="showWorkspaceModal = true"
        />
      </div>

      <nav v-if="routes" class="flex-1 p-4 space-y-1">
        <NuxtLink
          :to="routes.home"
          class="block px-3 py-2 rounded hover:bg-gray-100"
          active-class="bg-gray-100 font-medium"
          >Dashboard</NuxtLink
        >
        <NuxtLink
          :to="routes.bots"
          class="block px-3 py-2 rounded hover:bg-gray-100"
          active-class="bg-gray-100 font-medium"
          >Bots</NuxtLink
        >
        <NuxtLink
          :to="routes.rules"
          class="block px-3 py-2 rounded hover:bg-gray-100"
          active-class="bg-gray-100 font-medium"
          >Rules</NuxtLink
        >
      </nav>

      <div class="p-4 text-xs text-gray-500 border-t">v0.1.0</div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header
        class="h-16 bg-white border-b flex items-center justify-between px-4"
      >
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-semibold">Telegram AI Moderator</h1>
          <span
            v-if="currentWorkspaceName"
            class="text-sm text-gray-500 hidden sm:inline"
          >
            / {{ currentWorkspaceName }}
          </span>
        </div>
        <div class="flex items-center gap-4 text-sm">
          <span v-if="session.data?.user" class="text-gray-600">
            {{ session.data.user.email }}
          </span>
          <button
            v-if="session.data"
            class="text-red-600 hover:underline"
            @click="signOut"
          >
            Sign out
          </button>
        </div>
      </header>

      <main class="p-6">
        <slot />
      </main>
    </div>

    <WorkspaceModal
      v-model="showWorkspaceModal"
      @created="onWorkspaceCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { authClient } from "~/lib/auth-client";
import { fetchUserWorkspaces } from "~/lib/fetch-workspaces";
import {
  findWorkspaceBySlug,
  resolveWorkspaceSlug,
} from "~/lib/workspace-resolve";
import { workspaceRoutes } from "~/lib/workspace-routes";
import { syncActiveWorkspaceSlug } from "~/lib/sync-active-workspace";

const session = authClient.useSession();
const routes = useWorkspaceRoutes();
const route = useRoute();
const showWorkspaceModal = ref(false);
const workspaceSwitcher = ref<{ reload: () => Promise<void> } | null>(null);
const currentWorkspaceName = ref("");

async function refreshWorkspaceName() {
  const workspaceSlug = routes.value?.slug;
  if (!workspaceSlug) {
    currentWorkspaceName.value = "";
    return;
  }

  const workspaces = await fetchUserWorkspaces();
  currentWorkspaceName.value =
    findWorkspaceBySlug(workspaces, workspaceSlug)?.name ?? "";
}

async function ensureWorkspace() {
  const { data: currentSession } = await authClient.getSession();

  if (!currentSession?.user?.emailVerified) {
    return;
  }

  if (
    route.path.startsWith("/w-") &&
    typeof route.params.slug === "string"
  ) {
    await syncActiveWorkspaceSlug(route.params.slug);
    await refreshWorkspaceName();
    return;
  }

  const workspaces = await fetchUserWorkspaces();

  if (!workspaces.length) {
    showWorkspaceModal.value = true;
    return;
  }

  const targetSlug = resolveWorkspaceSlug(
    workspaces,
    currentSession.session.activeOrganizationId
  );

  if (targetSlug) {
    await navigateTo(workspaceRoutes.home(targetSlug), { replace: true });
  }
}

async function onWorkspaceCreated(workspaceSlug: string) {
  await workspaceSwitcher.value?.reload();
  await refreshWorkspaceName();
  await navigateTo(workspaceRoutes.home(workspaceSlug), { replace: true });
}

onMounted(() => {
  void ensureWorkspace();
});

watch(
  () => route.params.slug,
  () => {
    void refreshWorkspaceName();
  }
);

watch(showWorkspaceModal, (isOpen) => {
  if (!isOpen) {
    void ensureWorkspace();
  }
});

async function signOut() {
  await authClient.signOut();
  await navigateTo("/login");
}
</script>
