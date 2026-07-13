<template>
  <footer class="border-t bg-white py-4 px-4 text-center text-sm text-gray-500">
    <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <NuxtLink to="/release-notes" class="hover:text-gray-800 hover:underline">
        Что нового
      </NuxtLink>
      <span class="text-gray-300">·</span>
      <a
        :href="APP_LINKS.authorTelegram"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-gray-800 hover:underline"
      >
        Author
      </a>
      <span class="text-gray-300">·</span>
      <a
        :href="APP_LINKS.personalSite"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-gray-800 hover:underline"
      >
        Site
      </a>
      <span class="text-gray-300">·</span>
      <NuxtLink to="/docs" class="hover:text-gray-800 hover:underline">Docs</NuxtLink>
      <span class="text-gray-300">·</span>
      <NuxtLink to="/terms" class="hover:text-gray-800 hover:underline">Terms</NuxtLink>
    </div>
    <div class="mt-2">
      <NuxtLink to="/release-notes" class="hover:text-gray-800 hover:underline">
        v{{ appVersion }}
      </NuxtLink>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { APP_LINKS } from "~/lib/app-config";

const runtimeConfig = useRuntimeConfig();
const appVersion = computed(() => runtimeConfig.public.appVersion as string);
</script>
