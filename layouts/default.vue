<template>
  <div class="min-h-screen flex bg-gray-100">
    <aside
      class="w-64 bg-white border-r border-gray-200 hidden md:flex md:flex-col"
    >
      <div class="h-16 flex items-center px-4 border-b">
        <span class="text-lg font-semibold">TG Moderator</span>
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
        </div>
        <div class="flex items-center gap-4 text-sm">
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

    <WorkspaceModal v-model="showWorkspaceModal" />
  </div>
</template>

<script setup lang="ts">
import { authClient } from "~/lib/auth-client";

const { data: session } = await authClient.useSession(useFetch);
const showWorkspaceModal = ref(false);

async function ensureWorkspace() {
  if (!session.value?.user?.emailVerified) {
    return;
  }

  const { data: organizations } = await authClient.organization.list();
  const activeId = session.value.session.activeOrganizationId;

  if (!organizations?.length) {
    showWorkspaceModal.value = true;
    return;
  }

  if (!activeId && organizations[0]?.id) {
    await authClient.organization.setActive({
      organizationId: organizations[0].id,
    });
    await reloadNuxtApp();
  }
}

onMounted(() => {
  ensureWorkspace();
});

async function signOut() {
  await authClient.signOut();
  await navigateTo("/login");
}
</script>
