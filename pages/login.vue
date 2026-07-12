<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-6 text-center">
      <h1 class="text-xl font-semibold">TG Moderator</h1>
      <p class="text-sm text-gray-600">
        Войдите через Telegram, чтобы управлять ботами модерации.
      </p>
      <a
        :href="telegramAuthHref"
        class="inline-flex w-full items-center justify-center rounded bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
      >
        Войти через Telegram
      </a>
      <p v-if="botLoginDeepLink" class="text-sm text-gray-600">
        Проблемы со входом?
        <a :href="botLoginDeepLink" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
          Получить ссылку у бота
        </a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});

usePageTitle("Вход");

const route = useRoute();
const config = useRuntimeConfig();

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
