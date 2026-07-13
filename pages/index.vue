<template>
  <div>
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      title="Dashboard"
    >
      <template #actions>
        <button
          type="button"
          class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          :disabled="loading"
          @click="load"
        >
          {{ loading ? "Loading..." : "Refresh" }}
        </button>
      </template>
    </LayoutPageHeader>

    <div v-if="loading" class="text-gray-500">Loading dashboard...</div>

    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 text-red-700 rounded p-4"
    >
      {{ error }}
    </div>

    <div
      v-else-if="dashboard && !dashboard.has_bots"
      class="bg-white border rounded p-8 text-center"
    >
      <p class="text-gray-600 mb-4">
        No bots yet. Open Bots to create your own or join a team with an access
        code.
      </p>
      <NuxtLink
        to="/bots"
        class="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
      >
        Manage bots
      </NuxtLink>
    </div>

    <div v-else-if="dashboard" class="space-y-6">
      <DashboardKpiCards :kpi="dashboard.kpi" />

      <ClientOnly>
        <DashboardActivityChart
          :trend7d="dashboard.trend_7d"
          :action-breakdown="dashboard.action_breakdown"
        />
        <template #fallback>
          <div class="bg-white border rounded p-6 text-gray-500 text-sm">
            Loading charts...
          </div>
        </template>
      </ClientOnly>

      <DashboardRecentActivity :activities="dashboard.recent_activity" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { DashboardData } from "~/types/dashboard";

usePageTitle("Панель");

const { breadcrumbs, backTo } = usePageBreadcrumbs([{ label: "Dashboard" }]);

const dashboard = ref<DashboardData | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;

  try {
    const resp = await $fetch<{ success: boolean; data: DashboardData }>(
      "/api/dashboard"
    );
    dashboard.value = resp?.data ?? null;
  } catch (err) {
    console.error("Error loading dashboard:", err);
    error.value = "Failed to load dashboard data. Please try again.";
    dashboard.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
