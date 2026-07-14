<template>
  <div class="min-h-screen flex flex-col bg-gray-100">
    <header class="bg-white border-b border-gray-200">
      <div
        class="h-16 flex items-center justify-between gap-4 px-4 max-w-screen-2xl mx-auto w-full"
      >
        <div class="flex items-center gap-4 min-w-0">
          <NuxtLink
            to="/"
            class="text-lg font-semibold shrink-0 hover:text-gray-700"
          >
            {{ t("app.name") }}
          </NuxtLink>
          <nav
            class="flex items-center gap-1 overflow-x-auto text-sm"
            :aria-label="t('nav.main')"
          >
            <NuxtLink
              to="/"
              class="px-3 py-2 rounded whitespace-nowrap hover:bg-gray-100"
              active-class="bg-gray-100 font-medium"
            >
              {{ t("nav.dashboard") }}
            </NuxtLink>
            <NuxtLink
              to="/bots"
              class="px-3 py-2 rounded whitespace-nowrap hover:bg-gray-100"
              active-class="bg-gray-100 font-medium"
            >
              {{ t("nav.bots") }}
            </NuxtLink>
          </nav>
        </div>
        <div class="flex items-center gap-4 text-sm shrink-0">
          <span v-if="session?.user" class="text-gray-600 hidden sm:inline">
            {{ displayName }}
          </span>
          <button
            v-if="session?.user"
            class="text-red-600 hover:underline"
            @click="signOut"
          >
            {{ t("nav.signOut") }}
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 p-4 md:p-6 max-w-screen-2xl mx-auto w-full">
      <slot />
    </main>

    <LayoutAppFooter class="mt-auto" />
  </div>
</template>

<script setup lang="ts">
import { fetchSession } from "~/lib/fetch-session";

const { t, locale } = useI18n();

useHead({
  titleTemplate: (titleChunk) => {
    const appName = t("app.name");
    return titleChunk ? `${titleChunk} · ${appName}` : appName;
  },
  htmlAttrs: {
    lang: () => locale.value,
  },
});

const { data: session, refresh: refreshSession } = await useAsyncData(
  "layout-auth-session",
  () => fetchSession()
);

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
