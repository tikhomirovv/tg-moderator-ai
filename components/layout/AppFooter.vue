<template>
  <footer class="border-t bg-white py-4 px-4 text-center text-sm text-gray-500">
    <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <NuxtLink to="/release-notes" class="hover:text-gray-800 hover:underline">
        {{ t("footer.releaseNotes") }}
      </NuxtLink>
      <span class="text-gray-300">·</span>
      <a
        :href="APP_LINKS.authorSite"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-gray-800 hover:underline"
      >
        {{ t("footer.author") }}
      </a>
      <span class="text-gray-300">·</span>
      <NuxtLink to="/docs" class="hover:text-gray-800 hover:underline">
        {{ t("footer.docs") }}
      </NuxtLink>
      <span class="text-gray-300">·</span>
      <NuxtLink to="/terms" class="hover:text-gray-800 hover:underline">
        {{ t("footer.terms") }}
      </NuxtLink>
    </div>
    <div class="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-sm text-gray-500">
      <span>
        {{ t("app.name") }}
        <NuxtLink to="/release-notes" class="hover:text-gray-800 hover:underline">
          v{{ appVersion }}
        </NuxtLink>
      </span>
      <span class="text-gray-300">|</span>
      <LayoutLocaleSwitcher />
    </div>
  </footer>
</template>

<script setup lang="ts">
import { APP_LINKS } from "~/lib/app-config";

const { t } = useI18n();

const runtimeConfig = useRuntimeConfig();
const appVersion = computed(() => runtimeConfig.public.appVersion as string);
</script>
