<template>
  <footer class="border-t bg-white py-4 px-4 text-center text-sm text-gray-500">
    <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <NuxtLink to="/release-notes" class="hover:text-gray-800 hover:underline">
        {{ t("footer.releaseNotes") }}
      </NuxtLink>
      <span class="text-gray-300">·</span>
      <a
        :href="APP_LINKS.authorTelegram"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-gray-800 hover:underline"
      >
        {{ t("footer.author") }}
      </a>
      <span class="text-gray-300">·</span>
      <a
        :href="APP_LINKS.personalSite"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-gray-800 hover:underline"
      >
        {{ t("footer.site") }}
      </a>
      <span class="text-gray-300">·</span>
      <NuxtLink to="/docs" class="hover:text-gray-800 hover:underline">
        {{ t("footer.docs") }}
      </NuxtLink>
      <span class="text-gray-300">·</span>
      <NuxtLink to="/terms" class="hover:text-gray-800 hover:underline">
        {{ t("footer.terms") }}
      </NuxtLink>
      <span class="text-gray-300 hidden sm:inline">·</span>
      <LayoutLocaleSwitcher class="hidden sm:inline-flex" />
    </div>
    <div class="mt-2 flex flex-col items-center gap-2 sm:hidden">
      <LayoutLocaleSwitcher />
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

const { t } = useI18n();

const runtimeConfig = useRuntimeConfig();
const appVersion = computed(() => runtimeConfig.public.appVersion as string);
</script>
