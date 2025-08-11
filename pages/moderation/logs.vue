<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold">Moderation Logs</h2>
      <button
        @click="load"
        class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
      >
        Refresh
      </button>
    </div>

    <div class="bg-white border rounded overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="text-left p-2">Time</th>
            <th class="text-left p-2">Bot</th>
            <th class="text-left p-2">Chat</th>
            <th class="text-left p-2">User</th>
            <th class="text-left p-2">Action</th>
            <th class="text-left p-2">Rule</th>
            <th class="text-left p-2">Confidence</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in rows" :key="idx" class="border-t">
            <td class="p-2">{{ row.timestamp }}</td>
            <td class="p-2">{{ row.bot_id }}</td>
            <td class="p-2">{{ row.chat_id }}</td>
            <td class="p-2">{{ row.user_id }}</td>
            <td class="p-2">{{ row.action }}</td>
            <td class="p-2">{{ row.rule_violated || "-" }}</td>
            <td class="p-2">{{ row.ai_confidence ?? "-" }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="rows.length === 0" class="p-4 text-gray-500">No logs</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const rows = ref<any[]>([]);

async function load() {
  try {
    const resp = await $fetch<any>("/api/moderation/logs");
    rows.value = resp?.data?.logs || [];
  } catch (error) {
    // В клиентской части используем более простой способ логирования
    // или можно добавить toast уведомление
    rows.value = [];
  }
}

onMounted(load);
</script>
