<template>
  <div class="max-w-2xl">
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      title="Documentation"
      subtitle="Coming soon."
    />
    <p class="text-gray-600">
      Product documentation will appear here. For now, use in-app tooltips and release notes.
    </p>
  </div>
</template>

<script setup lang="ts">
const { breadcrumbs, backTo } = usePageBreadcrumbs([
  { label: "Docs" },
]);

usePageTitle("Docs");
</script>
