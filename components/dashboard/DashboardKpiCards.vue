<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    <div class="bg-white border rounded p-4">
      <div class="text-sm text-gray-500 mb-1">Bots</div>
      <div class="text-2xl font-bold text-gray-900">{{ kpi.bots_total }}</div>
      <div class="text-xs text-gray-500 mt-1">
        <span class="text-green-600">{{ kpi.bots_active }} active</span>
        ·
        <span class="text-red-600">{{ kpi.bots_inactive }} inactive</span>
      </div>
    </div>

    <div class="bg-white border rounded p-4">
      <div class="text-sm text-gray-500 mb-1">Chats</div>
      <div class="text-2xl font-bold text-gray-900">{{ kpi.chats_total }}</div>
      <div class="text-xs text-gray-500 mt-1">Across all bots</div>
    </div>

    <div class="bg-white border rounded p-4">
      <div class="text-sm text-gray-500 mb-1">Today</div>
      <div class="grid grid-cols-2 gap-2 mt-2 text-sm">
        <div>
          <div class="text-lg font-semibold text-blue-600">
            {{ kpi.today_messages }}
          </div>
          <div class="text-xs text-gray-500">Messages</div>
        </div>
        <div>
          <div class="text-lg font-semibold text-yellow-600">
            {{ kpi.today_warnings }}
          </div>
          <div class="text-xs text-gray-500">Warnings</div>
        </div>
        <div>
          <div class="text-lg font-semibold text-orange-600">
            {{ kpi.today_deletes }}
          </div>
          <div class="text-xs text-gray-500">Deletes</div>
        </div>
        <div>
          <div class="text-lg font-semibold text-red-600">
            {{ kpi.today_bans }}
          </div>
          <div class="text-xs text-gray-500">Bans</div>
        </div>
      </div>
    </div>

    <div class="bg-white border rounded p-4">
      <div class="text-sm text-gray-500 mb-1">Users</div>
      <div class="text-2xl font-bold text-green-600">
        {{ kpi.users_active_24h }}
      </div>
      <div class="text-xs text-gray-500 mt-1">Active (24h)</div>
      <div class="text-lg font-semibold text-red-600 mt-2">
        {{ kpi.users_banned }}
      </div>
      <div class="text-xs text-gray-500">Banned (distinct)</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DashboardKpi } from "~/types/dashboard";

defineProps<{
  kpi: DashboardKpi;
}>();
</script>
