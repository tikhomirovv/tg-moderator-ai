<template>
  <div class="max-w-2xl">
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="t('page.docs.title')"
      :subtitle="t('page.docs.subtitle')"
    />
    <p class="text-gray-600">
      {{ t("page.docs.body") }}
    </p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("page.docs.breadcrumb") },
]);

usePageTitle(() => t("page.docs.documentTitle"));
</script>
