<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-6 text-center">
      <h1 class="text-xl font-semibold">{{ t("app.name") }}</h1>
      <p class="text-sm text-gray-600">
        {{ t("login.subtitle") }}
      </p>
      <a
        :href="telegramAuthHref"
        class="inline-flex w-full items-center justify-center rounded bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
      >
        {{ t("login.signInButton") }}
      </a>
      <p v-if="botLoginDeepLink" class="text-sm text-gray-600">
        {{ t("login.trouble") }}
        <a :href="botLoginDeepLink" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
          {{ t("login.getLinkFromBot") }}
        </a>
      </p>
      <div class="pt-2 flex flex-wrap items-center justify-center gap-x-2 text-sm text-gray-500">
        <span>
          {{ t("app.name") }}
          <NuxtLink to="/release-notes" class="hover:text-gray-800 hover:underline">
            v{{ appVersion }}
          </NuxtLink>
        </span>
        <span class="text-gray-300">|</span>
        <LayoutLocaleSwitcher />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});

const { t } = useI18n();

usePageTitle(() => t("page.login.documentTitle"));

const config = useRuntimeConfig();
const appVersion = computed(() => config.public.appVersion as string);

const route = useRoute();

const botLoginDeepLink = computed(() => {
  const username = config.public.telegramLoginBotUsername?.trim();
  if (!username) return "";
  return `https://t.me/${username}?start=login`;
});

const telegramAuthHref = computed(() => {
  const returnTo = route.query.returnTo;
  if (typeof returnTo === "string" && returnTo.trim()) {
    return `/api/auth/telegram?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return "/api/auth/telegram";
});
</script>
