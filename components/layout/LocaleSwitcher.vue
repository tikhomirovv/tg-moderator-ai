<template>
  <div class="inline-flex items-center gap-2 text-sm">
    <button
      type="button"
      class="hover:text-gray-800 hover:underline uppercase"
      :class="locale === 'en' ? 'text-gray-900 font-medium underline' : 'text-gray-500'"
      @click="switchLocale('en')"
    >
      {{ $t("footer.localeEn") }}
    </button>
    <button
      type="button"
      class="hover:text-gray-800 hover:underline uppercase"
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
