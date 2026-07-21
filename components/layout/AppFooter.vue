<template>
  <footer class="border-t bg-white py-4 px-4 text-center text-sm text-gray-500">
    <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <NuxtLink to="/release-notes" class="hover:text-gray-800 hover:underline">
        {{ t("footer.releaseNotes") }}
      </NuxtLink>
      <template v-if="isSaas">
        <span class="text-gray-300">·</span>
        <a
          :href="APP_LINKS.productSite"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-gray-800 hover:underline"
        >
          {{ t("footer.productSite") }}
        </a>
      </template>
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
      <template v-if="isSelfHosted">
        <span class="text-gray-300">·</span>
        <a
          :href="APP_LINKS.githubRepo"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-gray-800 hover:underline"
        >
          {{ t("footer.github") }}
        </a>
      </template>
    </div>
    <div class="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-sm text-gray-500">
      <span>
        {{ appName }}
        <NuxtLink to="/release-notes" class="hover:text-gray-800 hover:underline">
          v{{ appVersion }}
        </NuxtLink>
        <span class="text-gray-400"> — </span>
        {{ t("footer.tagline") }}
      </span>
      <span class="text-gray-300">|</span>
      <LayoutLocaleSwitcher />
    </div>
  </footer>
</template>

<script setup lang="ts">
import { APP_LINKS } from "~/lib/app-config";

const { t } = useI18n();
const appName = useAppName();

const runtimeConfig = useRuntimeConfig();
const appVersion = computed(() => runtimeConfig.public.appVersion as string);
const isSelfHosted = computed(
  () => runtimeConfig.public.deploymentMode === "self-hosted"
);
const isSaas = computed(() => runtimeConfig.public.deploymentMode === "saas");
</script>
