<template>
  <div class="inline-flex items-center gap-1 text-sm">
    <button
      type="button"
      class="hover:text-gray-800 hover:underline"
      :class="locale === 'en' ? 'text-gray-900 font-medium underline' : 'text-gray-500'"
      @click="switchLocale('en')"
    >
      {{ $t("footer.localeEn") }}
    </button>
    <span class="text-gray-300">·</span>
    <button
      type="button"
      class="hover:text-gray-800 hover:underline"
      :class="locale === 'ru' ? 'text-gray-900 font-medium underline' : 'text-gray-500'"
      @click="switchLocale('ru')"
    >
      {{ $t("footer.localeRu") }}
    </button>
  </div>
</template>

<script setup lang="ts">
const { locale, switchLocale } = useAppLocale();
</script>
