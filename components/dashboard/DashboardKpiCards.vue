<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    <div class="bg-white border rounded p-4">
      <div class="text-sm text-gray-500 mb-1">{{ t("dashboard.kpi.bots") }}</div>
      <div class="text-2xl font-bold text-gray-900">{{ kpi.bots_total }}</div>
      <div class="text-xs text-gray-500 mt-1">
        <span class="text-green-600">{{
          t("dashboard.kpi.active", { count: kpi.bots_active })
        }}</span>
        ·
        <span class="text-red-600">{{
          t("dashboard.kpi.inactive", { count: kpi.bots_inactive })
        }}</span>
      </div>
    </div>

    <div class="bg-white border rounded p-4">
      <div class="text-sm text-gray-500 mb-1">{{ t("dashboard.kpi.chats") }}</div>
      <div class="text-2xl font-bold text-gray-900">{{ kpi.chats_total }}</div>
      <div class="text-xs text-gray-500 mt-1">{{ t("dashboard.kpi.acrossAllBots") }}</div>
    </div>

    <div class="bg-white border rounded p-4">
      <div class="text-sm text-gray-500 mb-1">{{ t("dashboard.kpi.today") }}</div>
      <div class="grid grid-cols-2 gap-2 mt-2 text-sm">
        <div>
          <div class="text-lg font-semibold text-blue-600">
            {{ kpi.today_messages }}
          </div>
          <div class="text-xs text-gray-500">{{ t("dashboard.kpi.messages") }}</div>
        </div>
        <div>
          <div class="text-lg font-semibold text-yellow-600">
            {{ kpi.today_warnings }}
          </div>
          <div class="text-xs text-gray-500">{{ t("dashboard.kpi.warnings") }}</div>
        </div>
        <div>
          <div class="text-lg font-semibold text-orange-600">
            {{ kpi.today_deletes }}
          </div>
          <div class="text-xs text-gray-500">{{ t("dashboard.kpi.deletes") }}</div>
        </div>
        <div>
          <div class="text-lg font-semibold text-red-600">
            {{ kpi.today_bans }}
          </div>
          <div class="text-xs text-gray-500">{{ t("dashboard.kpi.bans") }}</div>
        </div>
      </div>
    </div>

    <div class="bg-white border rounded p-4">
      <div class="text-sm text-gray-500 mb-1">{{ t("dashboard.kpi.users") }}</div>
      <div class="text-2xl font-bold text-green-600">
        {{ kpi.users_active_24h }}
      </div>
      <div class="text-xs text-gray-500 mt-1">{{ t("dashboard.kpi.active24h") }}</div>
      <div class="text-lg font-semibold text-red-600 mt-2">
        {{ kpi.users_banned }}
      </div>
      <div class="text-xs text-gray-500">{{ t("dashboard.kpi.bannedDistinct") }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DashboardKpi } from "~/types/dashboard";

const { t } = useI18n();

defineProps<{
  kpi: DashboardKpi;
}>();
</script>
