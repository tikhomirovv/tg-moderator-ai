<template>
  <div class="min-h-screen flex bg-gray-100">
    <aside
      class="w-64 bg-white border-r border-gray-200 hidden md:flex md:flex-col"
    >
      <div class="h-16 flex items-center px-4 border-b">
        <span class="text-lg font-semibold">TG Moderator</span>
      </div>

      <div class="p-4 border-b">
        <WorkspaceSwitcher
          ref="workspaceSwitcher"
          :current-workspace-id="currentWorkspaceId"
          @create-workspace="showWorkspaceModal = true"
          @switched="onWorkspaceSwitched"
        />
      </div>

      <nav class="flex-1 p-4 space-y-1">
        <NuxtLink
          to="/"
          class="block px-3 py-2 rounded hover:bg-gray-100"
          active-class="bg-gray-100 font-medium"
          >Dashboard</NuxtLink
        >
        <NuxtLink
          to="/bots"
          class="block px-3 py-2 rounded hover:bg-gray-100"
          active-class="bg-gray-100 font-medium"
          >Bots</NuxtLink
        >
        <NuxtLink
          to="/config/rules"
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
          <button
            v-if="session?.user"
            type="button"
            class="text-blue-600 hover:underline"
            @click="showInviteModal = true"
          >
            Invite member
          </button>
          <span v-if="session?.user" class="text-gray-600">
            {{ session.user.email }}
          </span>
          <button
            v-if="session"
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
    <InviteMemberModal v-model="showInviteModal" />
  </div>
</template>

<script setup lang="ts">
import { authClient } from "~/lib/auth-client";
import { fetchAuthSession } from "~/lib/fetch-auth-session";
import { fetchUserWorkspaces } from "~/lib/fetch-workspaces";
import {
  provideWorkspaceContext,
  type WorkspaceSwitchHandler,
} from "~/composables/useWorkspaceContext";

const { data: session, refresh: refreshSession } = await useAsyncData(
  "layout-auth-session",
  () => fetchAuthSession()
);
const showWorkspaceModal = ref(false);
const showInviteModal = ref(false);
const workspaceSwitcher = ref<{ reload: () => Promise<void> } | null>(null);
const currentWorkspaceName = ref("");
const workspaceSwitchHandlers = new Set<WorkspaceSwitchHandler>();

const currentWorkspaceId = computed(
  () => session.value?.session?.activeOrganizationId ?? undefined
);

async function completeWorkspaceSwitch(workspaceId: string): Promise<void> {
  await refreshSession();
  await refreshWorkspaceName();
  await workspaceSwitcher.value?.reload();

  for (const handler of workspaceSwitchHandlers) {
    await handler(workspaceId);
  }
}

provideWorkspaceContext({
  activeWorkspaceId: currentWorkspaceId,
  registerOnSwitch(handler) {
    workspaceSwitchHandlers.add(handler);
    onUnmounted(() => {
      workspaceSwitchHandlers.delete(handler);
    });
  },
  completeSwitch: completeWorkspaceSwitch,
});

async function onWorkspaceSwitched(workspaceId: string) {
  await completeWorkspaceSwitch(workspaceId);
}

async function refreshWorkspaceName() {
  const workspaceId = currentWorkspaceId.value;
  if (!workspaceId) {
    currentWorkspaceName.value = "";
    return;
  }

  const workspaces = await fetchUserWorkspaces();
  currentWorkspaceName.value =
    workspaces.find((workspace) => workspace.id === workspaceId)?.name ?? "";
}

async function ensureWorkspace() {
  const { data: currentSession } = await authClient.getSession();

  if (!currentSession?.user?.emailVerified) {
    return;
  }

  const workspaces = await fetchUserWorkspaces();

  if (!workspaces.length) {
    showWorkspaceModal.value = true;
    return;
  }

  const activeId = currentSession.session.activeOrganizationId;
  if (!activeId && workspaces[0]?.id) {
    await authClient.organization.setActive({
      organizationId: workspaces[0].id,
    });
    await authClient.getSession();
  }

  await refreshWorkspaceName();
}

async function onWorkspaceCreated() {
  await workspaceSwitcher.value?.reload();
  await authClient.getSession();
  const workspaceId = session.value?.session?.activeOrganizationId;
  if (workspaceId) {
    await completeWorkspaceSwitch(workspaceId);
  } else {
    await refreshSession();
    await refreshWorkspaceName();
  }
}

onMounted(() => {
  void ensureWorkspace();
});

watch(currentWorkspaceId, () => {
  void refreshWorkspaceName();
});

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
