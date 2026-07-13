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
        >
          Dashboard
        </NuxtLink>
        <NuxtLink
          to="/bots"
          class="block px-3 py-2 rounded hover:bg-gray-100"
          active-class="bg-gray-100 font-medium"
        >
          Bots
        </NuxtLink>
      </nav>

      <div class="p-4 text-xs border-t">
        <NuxtLink
          to="/release-notes"
          class="text-gray-500 hover:text-gray-800 hover:underline"
          active-class="text-gray-900 font-medium"
        >
          v{{ appVersion }}
        </NuxtLink>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header
        class="h-16 bg-white border-b flex items-center justify-between px-4"
      >
        <h1 class="text-lg font-semibold">Telegram AI Moderator</h1>
        <div class="flex items-center gap-4 text-sm">
          <span v-if="session?.user" class="text-gray-600">
            {{ displayName }}
          </span>
          <button
            v-if="session?.user"
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
  </div>
</template>

<script setup lang="ts">
import { fetchSession } from "~/lib/fetch-session";

const { data: session, refresh: refreshSession } = await useAsyncData(
  "layout-auth-session",
  () => fetchSession()
);

const runtimeConfig = useRuntimeConfig();
const appVersion = computed(() => runtimeConfig.public.appVersion as string);

const displayName = computed(() => {
  const user = session.value?.user;
  if (!user) return "";
  if (user.username) return `@${user.username}`;
  return user.name;
});

async function signOut() {
  await $fetch("/api/auth/sign-out", { method: "POST", body: {} });
  await refreshSession();
  await navigateTo("/login");
}
</script>
