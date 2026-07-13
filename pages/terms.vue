<template>
  <div class="max-w-2xl">
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      title="Terms of Service"
      subtitle="Coming soon."
    />
    <p class="text-gray-600">
      Terms and conditions will be published here.
    </p>
  </div>
</template>

<script setup lang="ts">
const { breadcrumbs, backTo } = usePageBreadcrumbs([
  { label: "Terms" },
]);

usePageTitle("Terms");
</script>
