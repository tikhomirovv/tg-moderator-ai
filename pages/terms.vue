<template>
  <div class="max-w-2xl">
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="t('page.terms.title')"
      :subtitle="t('page.terms.subtitle')"
    />
    <p class="text-gray-600">
      {{ t("page.terms.body") }}
    </p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("page.terms.breadcrumb") },
]);

usePageTitle(() => t("page.terms.documentTitle"));
</script>
