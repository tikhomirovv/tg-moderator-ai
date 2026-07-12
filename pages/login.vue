<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-6 text-center">
      <h1 class="text-xl font-semibold">TG Moderator</h1>
      <p class="text-sm text-gray-600">
        Войдите через Telegram, чтобы управлять ботами модерации.
      </p>
      <a
        href="/api/auth/telegram"
        class="inline-flex w-full items-center justify-center rounded bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
      >
        Войти через Telegram
      </a>
      <p class="text-sm text-gray-500">
        Уже есть код доступа?
        <NuxtLink to="/join" class="text-blue-600 hover:underline">Join team</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});
</script>
