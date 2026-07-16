<template>
  <div class="bg-white border rounded p-6">
    <h3 class="text-lg font-medium mb-4">{{ t("dashboard.recentActivity.title") }}</h3>

    <div
      v-if="activities.length === 0"
      class="text-gray-500 text-sm py-8 text-center"
    >
      {{ t("dashboard.recentActivity.empty") }}
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b">
            <th class="pb-2 pr-4 font-medium">{{ t("dashboard.recentActivity.time") }}</th>
            <th class="pb-2 pr-4 font-medium">{{ t("dashboard.recentActivity.bot") }}</th>
            <th class="pb-2 pr-4 font-medium">{{ t("dashboard.recentActivity.chat") }}</th>
            <th class="pb-2 pr-4 font-medium">{{ t("dashboard.recentActivity.action") }}</th>
            <th class="pb-2 font-medium">{{ t("dashboard.recentActivity.rule") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in activities"
            :key="`${item.bot_id}-${item.timestamp}-${index}`"
            class="border-b last:border-b-0"
          >
            <td class="py-2 pr-4 text-gray-600 whitespace-nowrap">
              {{ formatTime(item.timestamp) }}
            </td>
            <td class="py-2 pr-4">
              <NuxtLink
                :to="`/bots/${item.bot_id}`"
                class="text-blue-600 hover:underline"
              >
                @{{ item.bot_id }}
              </NuxtLink>
            </td>
            <td class="py-2 pr-4 text-gray-700">{{ chatLabel(item) }}</td>
            <td class="py-2 pr-4">
              <span :class="actionClass(item.action_type)">
                {{ actionLabel(item.action_type) }}
              </span>
            </td>
            <td class="py-2 text-gray-600">
              {{
                item.rule_name ||
                (item.rule_violated ? t("dashboard.recentActivity.unknownRule") : t("common.dash"))
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DashboardRecentActivityItem } from "~/types/dashboard";

const { t, locale } = useI18n();
const { actionLabel, actionClass } = useModerationActionDisplay();

defineProps<{
  activities: DashboardRecentActivityItem[];
}>();

function formatTime(iso: string): string {
  const loc = locale.value === "ru" ? "ru-RU" : "en-US";
  return new Date(iso).toLocaleString(loc);
}

function chatLabel(item: DashboardRecentActivityItem): string {
  if (item.chat_name) {
    return item.chat_name;
  }
  return t("audit.chatFallback", { chatId: item.chat_id });
}
</script>
