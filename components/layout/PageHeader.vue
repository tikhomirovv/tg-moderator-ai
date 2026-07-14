<template>
  <div class="mb-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div
        v-if="showBreadcrumbs"
        class="flex items-center gap-2 min-w-0"
      >
        <button
          v-if="backTo"
          type="button"
          class="shrink-0 rounded border px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
          :aria-label="t('common.back')"
          @click="navigateTo(backTo)"
        >
          ←
        </button>
        <nav class="text-sm text-gray-600 min-w-0" :aria-label="t('common.breadcrumb')">
          <ol class="flex flex-wrap items-center gap-1">
            <li
              v-for="(item, index) in breadcrumbs"
              :key="`${item.label}-${index}`"
              class="inline-flex items-center gap-1"
            >
              <NuxtLink
                v-if="item.to"
                :to="item.to"
                class="hover:text-gray-900 hover:underline truncate max-w-[12rem] sm:max-w-none"
              >
                {{ item.label }}
              </NuxtLink>
              <span v-else class="text-gray-900 font-medium truncate max-w-[12rem] sm:max-w-none">
                {{ item.label }}
              </span>
              <span v-if="index < breadcrumbs.length - 1" class="text-gray-400">›</span>
            </li>
          </ol>
        </nav>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap gap-2 shrink-0 ml-auto">
        <slot name="actions" />
      </div>
    </div>
    <h1 v-if="title" class="text-xl font-semibold" :class="showBreadcrumbs ? 'mt-3' : ''">
      {{ title }}
    </h1>
    <p v-if="subtitle" class="text-sm text-gray-500 mt-1">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { BreadcrumbItem } from "~/composables/usePageBreadcrumbs";

const { t } = useI18n();

const props = defineProps<{
  breadcrumbs: BreadcrumbItem[];
  backTo?: string;
  title?: string;
  subtitle?: string;
}>();

// Top-level pages (Dashboard, Bots, …) only pass one crumb — same as h1, so hide the trail.
const showBreadcrumbs = computed(() => props.breadcrumbs.length > 1);
</script>
